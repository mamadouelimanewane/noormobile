import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

const libsql = createClient({ url: 'file:./dev.db' });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// Basic API to verify it works
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Register or Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { phone, role, name, vehicle } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      if (!name) return res.status(400).json({ error: 'Name required for registration' });
      user = await prisma.user.create({
        data: {
          phone,
          name,
          role,
          accountStatus: role === 'chauffeur' ? 'PENDING' : 'APPROVED',
          avatarColor: '#0a8f4c', // simplified
          vehicle: role === 'chauffeur' && vehicle ? {
            create: vehicle
          } : undefined
        }
      });
    } else {
      if (user.role !== role) {
        return res.status(400).json({ error: 'Role mismatch' });
      }
    }
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
app.get('/api/admin/pending-drivers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'chauffeur', accountStatus: 'PENDING' }, include: { vehicle: true } });
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/approve-driver', async (req, res) => {
  try {
    const { driverId } = req.body;
    const user = await prisma.user.update({
      where: { id: driverId },
      data: { accountStatus: 'APPROVED' }
    });
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet routes
app.post('/api/wallet/topup', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } }
    });
    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: 'topup',
        amount,
        method,
        status: 'completed',
        reference: `TOPUP-${Date.now()}`,
        description: `Recharge via ${method}`
      }
    });
    res.json({ ok: true, user, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/cashout', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < amount) {
      return res.status(400).json({ error: 'Solde insuffisant' });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } }
    });
    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: 'cashout',
        amount: -amount,
        method,
        status: 'completed',
        reference: `CASHOUT-${Date.now()}`,
        description: `Retrait vers ${method}`
      }
    });
    res.json({ ok: true, user: updatedUser, transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Realtime Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('driver:online', async (data: { driverId: string }) => {
    socket.join('drivers');
    await prisma.user.update({
      where: { id: data.driverId },
      data: { isOnline: true }
    });
  });

  socket.on('driver:offline', async (data: { driverId: string }) => {
    await prisma.user.update({
      where: { id: data.driverId },
      data: { isOnline: false }
    });
  });

  socket.on('driver:location', (data: { driverId: string, lat: number, lng: number }) => {
    // Broadcast to passengers looking for cars, or to specific active request room
    io.emit('driver:moved', data);
  });

  socket.on('ride:request', async (data) => {
    // Save to DB and broadcast to drivers
    const req = await prisma.serviceRequest.create({
      data: {
        type: data.type,
        passengerId: data.passengerId,
        proposedPrice: data.proposedPrice,
        pickupLat: data.pickup.lat,
        pickupLng: data.pickup.lng,
        pickupLabel: data.pickup.label,
        dropoffLat: data.dropoff.lat,
        dropoffLng: data.dropoff.lng,
        dropoffLabel: data.dropoff.label,
        status: 'recherche'
      }
    });
    const formattedReq = {
      ...req,
      offers: [],
      createdAt: req.createdAt.getTime(),
      updatedAt: req.updatedAt.getTime()
    };
    
    io.to('drivers').emit('ride:new_request', formattedReq);
    socket.emit('ride:created', formattedReq);
  });

  socket.on('ride:offer', async (data) => {
    // Driver makes an offer
    const offer = await prisma.offer.create({
      data: {
        requestId: data.requestId,
        driverId: data.driverId,
        price: data.price,
        etaMin: data.etaMin,
        status: 'en_attente'
      },
      include: { driver: { include: { vehicle: true } } }
    });
    
    const formattedOffer = {
      id: offer.id,
      requestId: offer.requestId,
      driverId: offer.driverId,
      driverName: offer.driver.name,
      driverRating: offer.driver.rating,
      vehicle: offer.driver.vehicle ? `${offer.driver.vehicle.marque} ${offer.driver.vehicle.modele} · ${offer.driver.vehicle.couleur}` : 'Véhicule standard',
      price: offer.price,
      etaMin: offer.etaMin,
      status: offer.status,
      createdAt: offer.createdAt.getTime(),
    };
    
    // Notify passenger
    io.emit('ride:new_offer', formattedOffer);
  });

  socket.on('ride:accept', async (data) => {
    // Passenger accepts an offer
    const offer = await prisma.offer.findUnique({ where: { id: data.offerId }, include: { driver: true } });
    if (!offer) return;

    const req = await prisma.serviceRequest.update({
      where: { id: offer.requestId },
      data: {
        status: 'attribue',
        driverId: offer.driverId,
        proposedPrice: offer.price,
      }
    });

    await prisma.offer.updateMany({
      where: { requestId: req.id, id: { not: offer.id } },
      data: { status: 'refusee' }
    });

    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: 'acceptee' }
    });

    const formattedOffer = {
      id: offer.id,
      requestId: offer.requestId,
      driverId: offer.driverId,
      driverName: offer.driver.name,
      driverRating: offer.driver.rating,
      vehicle: offer.driver.vehicle ? `${offer.driver.vehicle.marque} ${offer.driver.vehicle.modele} · ${offer.driver.vehicle.couleur}` : 'Véhicule standard',
      price: offer.price,
      etaMin: offer.etaMin,
      status: offer.status,
      createdAt: offer.createdAt.getTime(),
      driver: {
        position: { lat: 14.6937, lng: -17.4441, label: 'En route' } // Default simulation position
      }
    };

    io.emit('ride:accepted', { request: req, offer: formattedOffer });
  });

  socket.on('ride:cancel', async (data) => {
    const req = await prisma.serviceRequest.update({
      where: { id: data.requestId },
      data: { status: 'annule' }
    });
    
    const formattedReq = {
      ...req,
      createdAt: req.createdAt.getTime(),
      updatedAt: req.updatedAt.getTime()
    };
    
    io.emit('ride:cancelled', formattedReq);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
