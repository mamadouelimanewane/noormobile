import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// Basic API to verify it works
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Register or Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { phone, role, name, vehicle, referralCode } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      if (!name) return res.status(400).json({ error: 'Name required for registration' });
      
      const newCode = 'NOOR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      let sponsor = null;
      if (referralCode) {
        sponsor = await prisma.user.findUnique({ where: { referralCode } });
      }

      user = await prisma.user.create({
        data: {
          phone,
          name,
          role,
          accountStatus: role === 'chauffeur' ? 'PENDING' : 'APPROVED',
          avatarColor: '#0a8f4c',
          referralCode: newCode,
          referredById: sponsor?.id || null,
          vehicle: role === 'chauffeur' && vehicle ? {
            create: vehicle
          } : undefined
        }
      });

      if (sponsor) {
        const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
        const sponsorBonus = settings?.referralBonusSponsor || 1000;
        const refereeBonus = settings?.referralBonusReferee || 500;

        await prisma.$transaction([
          prisma.user.update({
            where: { id: sponsor.id },
            data: { walletBalance: { increment: sponsorBonus } }
          }),
          prisma.transaction.create({
            data: {
              userId: sponsor.id,
              type: 'topup',
              amount: sponsorBonus,
              method: 'system',
              status: 'completed',
              reference: `REF-${user.id}`,
              description: `Bonus Parrainage (${user.name})`
            }
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: { increment: refereeBonus } }
          }),
          prisma.transaction.create({
            data: {
              userId: user.id,
              type: 'topup',
              amount: refereeBonus,
              method: 'system',
              status: 'completed',
              reference: `WELC-${user.id}`,
              description: `Bonus Bienvenue (Parrainé)`
            }
          })
        ]);
        user = await prisma.user.findUnique({ where: { id: user.id } }) as any;
      }
    } else {
      if (user.role !== role) {
        return res.status(400).json({ error: 'Role mismatch' });
      }
      if (!user.referralCode) {
        const newCode = 'NOOR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        user = await prisma.user.update({ where: { id: user.id }, data: { referralCode: newCode } });
      }
    }
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes
app.get('/api/admin/settings', async (req, res) => {
  try {
    let settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: 'default' } });
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  try {
    const { commissionRate, referralBonusSponsor, referralBonusReferee } = req.body;
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { commissionRate, referralBonusSponsor, referralBonusReferee },
      create: { id: 'default', commissionRate, referralBonusSponsor, referralBonusReferee }
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
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
    const { driverId, action } = req.body; // action: 'APPROVED' or 'REJECTED'
    const user = await prisma.user.update({
      where: { id: driverId },
      data: { accountStatus: action || 'APPROVED' }
    });
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/driver/documents', async (req, res) => {
  try {
    const { driverId, type, url } = req.body;
    const doc = await prisma.driverDocument.create({
      data: { driverId, type, url, status: 'PENDING' }
    });
    res.json({ ok: true, document: doc });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/documents', async (req, res) => {
  try {
    const docs = await prisma.driverDocument.findMany({
      include: { driver: true }
    });
    res.json({ ok: true, documents: docs });
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

// Pricing routes
app.post('/api/pricing/estimate', async (req, res) => {
  try {
    const { distanceKm, type, category } = req.body;
    let baseRate = 500; // Standard rate per km
    let minPrice = 1000;
    
    if (category === 'Confort') {
      baseRate = 800;
      minPrice = 2000;
    } else if (category === 'Moto') {
      baseRate = 300;
      minPrice = 500;
    }
    
    // Simulate Surge Pricing (e.g., multiplier between 1.0 and 1.5 based on random demand)
    // In a real app, this would query active requests in the geohash
    const surgeMultiplier = 1.0 + (Math.random() * 0.5); 
    
    let estimatedPrice = Math.max(minPrice, Math.round(distanceKm * baseRate * surgeMultiplier));
    
    res.json({ ok: true, estimatedPrice, surgeMultiplier: surgeMultiplier > 1.2 });
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
        status: 'recherche',
        packageDesc: data.packageInfo?.description,
        packageSize: data.packageInfo?.taille,
        destName: data.packageInfo?.destinataireNom,
        destPhone: data.packageInfo?.destinatairePhone,
        villeDepart: data.intercityInfo?.villeDepart,
        villeArrivee: data.intercityInfo?.villeArrivee,
        dateDepart: data.intercityInfo?.dateDepart,
        places: data.intercityInfo?.places,
      }
    });
    
    let packageInfo = undefined;
    if (req.packageDesc) {
      packageInfo = {
        description: req.packageDesc,
        taille: req.packageSize,
        destinataireNom: req.destName,
        destinatairePhone: req.destPhone
      };
    }

    let intercityInfo = undefined;
    if (req.villeDepart) {
      intercityInfo = {
        villeDepart: req.villeDepart,
        villeArrivee: req.villeArrivee,
        dateDepart: req.dateDepart,
        places: req.places
      };
    }

    const formattedReq = {
      ...req,
      offers: [],
      packageInfo,
      intercityInfo,
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
    const offer = await prisma.offer.findUnique({ 
      where: { id: data.offerId }, 
      include: { driver: { include: { vehicle: true } } } 
    });
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

  socket.on('ride:status', async (data) => {
    const req = await prisma.serviceRequest.update({
      where: { id: data.requestId },
      data: { status: data.status } // 'en_cours' or 'termine'
    });
    
    // For payments on completion
    if (data.status === 'termine' && req.driverId) {
      const commission = Math.round(req.proposedPrice * 0.12);
      const net = req.proposedPrice - commission;
      
      // Debit passenger
      await prisma.user.update({ where: { id: req.passengerId }, data: { walletBalance: { decrement: req.proposedPrice } } });
      // Credit driver
      await prisma.user.update({ where: { id: req.driverId }, data: { walletBalance: { increment: net } } });
      
      await prisma.transaction.create({
        data: { userId: req.passengerId, type: 'payment', amount: -req.proposedPrice, method: 'wave', status: 'completed', reference: req.id, description: `Paiement course` }
      });
      await prisma.transaction.create({
        data: { userId: req.driverId, type: 'payment', amount: req.proposedPrice, method: 'cash', status: 'completed', reference: req.id, description: `Gain course` }
      });
      await prisma.transaction.create({
        data: { userId: req.driverId, type: 'commission', amount: -commission, method: 'cash', status: 'completed', reference: req.id, description: `Commission plateforme` }
      });
    }

    const formattedReq = { ...req, createdAt: req.createdAt.getTime(), updatedAt: req.updatedAt.getTime() };
    io.emit('ride:updated', formattedReq);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
