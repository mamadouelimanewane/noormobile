import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- PUSH NOTIFICATIONS SERVICE (MOCK) ---
const sendPushNotification = async (userId: string, title: string, body: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) {
      console.log(`\n🔔 [PUSH NOTIFICATION to ${user.fcmToken}]: ${title} - ${body}\n`);
    }
  } catch(e) {
    console.error('Failed to send push notification', e);
  }
};
// -----------------------------------------
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

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
          accountStatus: 'APPROVED', // Auto-validation for demonstration mode
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
      if (user.role !== role && user.role !== 'both') {
        const updateData: any = { role: 'both' };
        if (role === 'chauffeur') {
          updateData.accountStatus = 'APPROVED'; // Auto-validation for demonstration mode
          if (vehicle) {
            const existingVehicle = await prisma.vehicle.findUnique({ where: { driverId: user.id } });
            if (!existingVehicle) updateData.vehicle = { create: vehicle };
          }
        }
        user = (await prisma.user.update({ where: { id: user.id }, data: updateData })) as any;
      }
      if (!user!.referralCode) {
        const newCode = 'NOOR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        user = await prisma.user.update({ where: { id: user!.id }, data: { referralCode: newCode } });
      }

      if (user!.accountStatus === 'PENDING') {
        user = await prisma.user.update({ where: { id: user!.id }, data: { accountStatus: 'APPROVED' } });
      }
    }
    
    // Override role in response to match the requested session role
    user!.role = role;
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/fcm-token', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { fcmToken: token }
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TONTINE APIS ----------------
app.get('/api/tontine/groups', async (req, res) => {
  try {
    const groups = await prisma.tontineGroup.findMany({
      include: { members: { include: { user: true } } }
    });
    res.json(groups);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tontine/groups', async (req, res) => {
  try {
    const { name, amountPerPeriod, frequency, maxMembers } = req.body;
    const group = await prisma.tontineGroup.create({
      data: { name, amountPerPeriod: Number(amountPerPeriod), frequency, maxMembers: Number(maxMembers) }
    });
    res.json(group);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tontine/join', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.driverLevel !== 'SILVER' && user.driverLevel !== 'GOLD')) {
      return res.status(403).json({ error: 'Niveau Silver ou Gold requis pour la Tontine.' });
    }
    
    const group = await prisma.tontineGroup.findUnique({ where: { id: groupId }, include: { members: true } });
    if (!group) return res.status(404).json({ error: 'Groupe introuvable.' });
    if (group.members.length >= group.maxMembers) return res.status(400).json({ error: 'Groupe complet.' });
    
    // Assign next available turnIndex
    const turnIndex = group.members.length + 1;
    const member = await prisma.tontineMember.create({
      data: { userId, groupId, turnIndex }
    });

    if (group.members.length + 1 === group.maxMembers) {
      await prisma.tontineGroup.update({ where: { id: groupId }, data: { status: 'ACTIVE' } });
    }
    
    res.json(member);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- WALLET APIS ---
app.get('/api/wallet/history/:userId', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: 'desc' }
    });
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { walletBalance: true }});
    res.json({ balance: user?.walletBalance || 0, transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/topup', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;
    if(amount <= 0) return res.status(400).json({error: 'Invalid amount'});
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } }
    });
    
    await prisma.transaction.create({
      data: {
        userId, type: 'topup', amount, method: method || 'mobile_money',
        status: 'completed', reference: `TOPUP-${Date.now()}`, description: `Rechargement via ${method || 'Mobile Money'}`
      }
    });
    res.json({ ok: true, user, balance: user.walletBalance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/cashout', async (req, res) => {
  try {
    const { userId, amount, method, phone } = req.body;
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const feeRate = settings?.withdrawalFee || 0.01;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < amount) return res.status(400).json({ error: 'Fonds insuffisants' });
    
    const feeAmount = Math.round(amount * feeRate);
    const netAmount = amount - feeAmount;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } }
    });
    
    await prisma.transaction.create({
      data: {
        userId, type: 'cashout', amount: -amount, method: method || 'mobile_money',
        status: 'completed', reference: `CASHOUT-${Date.now()}`, description: `Retrait via ${method || 'Mobile Money'}`
      }
    });
    res.json({ ok: true, user: updatedUser, balance: updatedUser.walletBalance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/init-payment', async (req, res) => {
  try {
    const { userId, amount, method, phone } = req.body;
    if(amount <= 0) return res.status(400).json({error: 'Invalid amount'});
    
    // In a real scenario, this would call Wave or PayDunya API to generate a payment URL or trigger USSD push.
    // For now, we simulate sending the request to the aggregator and creating a pending transaction.
    const reference = `PAY-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    
    await prisma.transaction.create({
      data: {
        userId, type: 'topup', amount, method: method || 'mobile_money',
        status: 'pending', reference, description: `Rechargement en attente (${phone || 'Mobile'})`
      }
    });

    // Simulate Payment Gateway Response
    const mockPaymentUrl = `https://pay-gateway-simulator.com/checkout/${reference}`;
    
    res.json({ ok: true, reference, paymentUrl: mockPaymentUrl, status: 'pending' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook to receive payment confirmation from Wave / Orange Money / PayDunya
app.post('/api/webhooks/payments', async (req, res) => {
  try {
    // 1. Verify webhook signature (Security)
    // const signature = req.headers['x-webhook-signature'];
    
    const { reference, status, amount } = req.body; // Payload sent by the aggregator

    const transaction = await prisma.transaction.findFirst({ where: { reference } });
    if (!transaction) return res.status(404).json({ error: 'Transaction non trouvée' });
    if (transaction.status === 'completed') return res.status(200).json({ ok: true, note: 'Already processed' });

    if (status === 'success' || status === 'completed') {
      // Execute the topup transaction atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'completed' }
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: { walletBalance: { increment: transaction.amount } }
        })
      ]);
      console.log(`Webhook: Payment ${reference} successful. Wallet credited.`);
    } else if (status === 'failed' || status === 'cancelled') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      });
      console.log(`Webhook: Payment ${reference} failed.`);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});
// --------------------

// --- MICRO-CREDIT APIS ----------------

// --- COVOITURAGE INTERURBAIN APIS ---
app.get('/api/carpool/trips', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const trips = await prisma.carpoolTrip.findMany({
      where: {
        status: 'OPEN',
        villeDepart: from as string,
        villeArrivee: to as string,
        // In a real app we'd filter >= date. For now, we return all OPEN for the route
      },
      include: {
        driver: { select: { id: true, name: true, phone: true, rating: true, avatarColor: true, vehicle: true } }
      },
      orderBy: { dateDepart: 'asc' }
    });
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/carpool/trips', async (req, res) => {
  try {
    const { driverId, villeDepart, villeArrivee, dateDepart, prixParPlace, placesTotales } = req.body;
    const trip = await prisma.carpoolTrip.create({
      data: {
        driverId, villeDepart, villeArrivee, 
        dateDepart: new Date(dateDepart), 
        prixParPlace, placesTotales
      }
    });
    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/carpool/book', async (req, res) => {
  try {
    const { tripId, passengerId, placesToBook } = req.body;
    
    // 1. Fetch trip
    const trip = await prisma.carpoolTrip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trajet non trouvé' });
    
    // 2. Check seats
    const availableSeats = trip.placesTotales - trip.placesReservees;
    if (availableSeats < placesToBook) return res.status(400).json({ error: 'Pas assez de places disponibles' });
    
    const totalPrice = trip.prixParPlace * placesToBook;
    
    // 3. Check passenger wallet
    const passenger = await prisma.user.findUnique({ where: { id: passengerId } });
    if (!passenger || passenger.walletBalance < totalPrice) {
      return res.status(400).json({ error: 'Solde insuffisant. Veuillez recharger votre portefeuille.' });
    }
    
    // 4. Execute transaction in Prisma
    const [updatedPassenger, updatedTrip, booking] = await prisma.$transaction([
      // Deduct passenger
      prisma.user.update({
        where: { id: passengerId },
        data: { walletBalance: { decrement: totalPrice } }
      }),
      // Credit driver
      prisma.user.update({
        where: { id: trip.driverId },
        data: { walletBalance: { increment: totalPrice } }
      }),
      // Create Transaction log (Passenger)
      prisma.transaction.create({
        data: {
          userId: passengerId, type: 'payment', amount: -totalPrice, method: 'wallet',
          status: 'completed', reference: `BOOK-${Date.now()}`, description: `Réservation covoiturage vers ${trip.villeArrivee}`
        }
      }),
      // Create Transaction log (Driver)
      prisma.transaction.create({
        data: {
          userId: trip.driverId, type: 'payment', amount: totalPrice, method: 'wallet',
          status: 'completed', reference: `TRIP-${Date.now()}`, description: `Gain covoiturage (Passager ID: ${passengerId})`
        }
      }),
      // Update trip
      prisma.carpoolTrip.update({
        where: { id: tripId },
        data: { 
          placesReservees: { increment: placesToBook },
          status: (trip.placesReservees + placesToBook) >= trip.placesTotales ? 'FULL' : 'OPEN'
        }
      }),
      // Create Booking
      prisma.carpoolBooking.create({
        data: {
          tripId, passengerId, placesBooked: placesToBook, totalPrice
        }
      })
    ]);
    
    res.json({ ok: true, booking, newBalance: updatedPassenger.walletBalance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MICRO-CREDIT APIS ---
app.post('/api/loans/request', async (req, res) => {
  try {
    const { driverId, montant, motif, dureeMois } = req.body;
    
    // Check pending/active loans
    const existing = await prisma.loanRequest.findFirst({
      where: { driverId, status: { in: ['en_attente', 'en_cours'] } }
    });
    if (existing) return res.status(400).json({ error: 'Vous avez déjà une demande en attente ou un prêt en cours.' });
    
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const maxLoan = settings?.maxLoanAmount || 100000;
    
    if (montant > maxLoan) return res.status(400).json({ error: `Le montant ne peut excéder ${maxLoan} FCFA.` });
    
    const loan = await prisma.loanRequest.create({
      data: {
        driverId, montant, motif, dureeMois, mensualite: Math.round(montant / dureeMois), status: 'en_attente'
      }
    });
    res.json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/loans/driver/:id', async (req, res) => {
  try {
    const loans = await prisma.loanRequest.findMany({
      where: { driverId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/loans', async (req, res) => {
  try {
    const loans = await prisma.loanRequest.findMany({
      include: { driver: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/loans/approve', async (req, res) => {
  try {
    const { loanId } = req.body;
    const loan = await prisma.loanRequest.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'en_attente') return res.status(400).json({ error: 'Prêt introuvable ou déjà traité' });
    
    await prisma.$transaction([
      prisma.loanRequest.update({ where: { id: loanId }, data: { status: 'en_cours' } }),
      prisma.user.update({ where: { id: loan.driverId }, data: { walletBalance: { increment: loan.montant } } }),
      prisma.transaction.create({
        data: {
          userId: loan.driverId, type: 'loan', amount: loan.montant, method: 'wallet', status: 'completed',
          reference: `LOAN-${loanId}`, description: `Déblocage Micro-crédit (${loan.motif})`
        }
      })
    ]);
    
    // Notify Driver via Push
    sendPushNotification(loan.driverId, 'Prêt Approuvé', `Votre prêt de ${loan.montant} FCFA a été viré sur votre wallet.`);
    
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/loans/reject', async (req, res) => {
  try {
    const { loanId } = req.body;
    await prisma.loanRequest.update({ where: { id: loanId }, data: { status: 'refuse' } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// --------------------

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
    const { commissionRate, referralBonusSponsor, referralBonusReferee, baseFare, perKmRate, withdrawalFee, maxLoanAmount } = req.body;
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: { commissionRate, referralBonusSponsor, referralBonusReferee, baseFare, perKmRate, withdrawalFee, maxLoanAmount },
      create: { id: 'default', commissionRate, referralBonusSponsor, referralBonusReferee, baseFare, perKmRate, withdrawalFee, maxLoanAmount }
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalRides = await prisma.serviceRequest.count({ where: { status: 'termine' } });
    const commissionData = await prisma.transaction.aggregate({
      where: { type: 'commission', status: 'completed' },
      _sum: { amount: true }
    });
    res.json({
      totalUsers,
      totalRides,
      totalRevenue: commissionData._sum.amount || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/taxes', async (req, res) => {
  try {
    const taxes = await prisma.tax.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(taxes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/taxes', async (req, res) => {
  try {
    const { name, rate } = req.body;
    const tax = await prisma.tax.create({ data: { name, rate } });
    res.json(tax);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/taxes/:id', async (req, res) => {
  try {
    const { isActive } = req.body;
    const tax = await prisma.tax.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.json(tax);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, documents: true }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { name, phone, vehicleData } = req.body;
    
    let updateData: any = { name, phone };
    
    // If it's a driver and vehicle data is passed
    if (vehicleData) {
      updateData.vehicle = {
        upsert: {
          create: vehicleData,
          update: vehicleData
        }
      };
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { vehicle: true, documents: true }
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    // Delete related vehicle if it exists
    await prisma.vehicle.deleteMany({ where: { driverId: req.params.id } });
    await prisma.driverDocument.deleteMany({ where: { driverId: req.params.id } });
    await prisma.transaction.deleteMany({ where: { userId: req.params.id } });
    await prisma.serviceRequest.deleteMany({ where: { passengerId: req.params.id } });
    
    const user = await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/pending-drivers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ where: { role: { in: ['chauffeur', 'both'] }, accountStatus: 'PENDING' }, include: { vehicle: true } });
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, phone: true, role: true } } }
    });
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/wallet/adjust', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } }
    });
    
    await prisma.transaction.create({
      data: {
        userId,
        type: amount >= 0 ? 'topup' : 'cashout',
        amount,
        method: 'admin_adjustment',
        status: 'completed',
        reference: `ADMIN-${Date.now()}`,
        description: description || 'Ajustement manuel par Admin'
      }
    });
    
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/wallet/import', async (req, res) => {
  try {
    const { data } = req.body; // array of { phone, amount }
    const results = { success: 0, failed: 0 };
    
    for (const item of data) {
      try {
        const user = await prisma.user.findUnique({ where: { phone: item.phone } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { walletBalance: { increment: Number(item.amount) } }
          });
          await prisma.transaction.create({
            data: {
              userId: user.id,
              type: Number(item.amount) >= 0 ? 'topup' : 'cashout',
              amount: Number(item.amount),
              method: 'admin_import',
              status: 'completed',
              reference: `IMPORT-${Date.now()}`,
              description: 'Rechargement via Import CSV'
            }
          });
          results.success++;
        } else {
          results.failed++;
        }
      } catch(e) {
        results.failed++;
      }
    }
    res.json(results);
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

app.post('/api/wallet/topup_v2', async (req, res) => {
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

app.post('/api/wallet/cashout_v2', async (req, res) => {
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
        reference: `CASH-${Date.now()}`,
        description: `Retrait via ${method}`
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
    const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
    
    let baseRate = settings?.perKmRate || 500;
    let minPrice = settings?.baseFare || 1000;
    
    if (category === 'Confort') {
      baseRate = Math.round(baseRate * 1.5);
      minPrice = Math.round(minPrice * 1.5);
    } else if (category === 'Moto') {
      baseRate = Math.round(baseRate * 0.5);
      minPrice = Math.round(minPrice * 0.5);
    }
    
    // Simulate Surge Pricing (e.g., multiplier between 1.0 and 1.5 based on random demand)
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
      pickup: { lat: req.pickupLat, lng: req.pickupLng, label: req.pickupLabel },
      dropoff: { lat: req.dropoffLat, lng: req.dropoffLng, label: req.dropoffLabel },
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

    if (offer.driver?.fcmToken) {
      sendPushNotification(offer.driverId, 'Course attribuée', 'Une nouvelle course vous a été attribuée.');
    }

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
      const settings = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
      let commRate = settings?.commissionRate || 0.12;
      
      const activeTaxes = await prisma.tax.findMany({ where: { isActive: true } });
      const totalTaxRate = activeTaxes.reduce((sum: number, t: any) => sum + t.rate, 0);

      // --- GAMIFICATION LOGIC ---
      const driver = await prisma.user.findUnique({ where: { id: req.driverId } });
      if (driver) {
        if (driver.driverLevel === 'SILVER') commRate = 0.10;
        if (driver.driverLevel === 'GOLD') commRate = 0.08;

        const newRidesCount = driver.completedRides + 1;
        let newLevel = 'BRONZE';
        if (newRidesCount > 50) newLevel = 'SILVER';
        if (newRidesCount > 200) newLevel = 'GOLD';

        await prisma.user.update({
          where: { id: req.driverId },
          data: { completedRides: newRidesCount, driverLevel: newLevel }
        });
      }
      // --------------------------

      const commission = Math.round(req.proposedPrice * commRate);
      const taxAmount = Math.round(req.proposedPrice * totalTaxRate);
      
      const net = req.proposedPrice - commission - taxAmount;
      
      // -- AUTO-REIMBURSEMENT LOGIC --
      const activeLoan = await prisma.loanRequest.findFirst({
        where: { driverId: req.driverId, status: 'en_cours' }
      });
      
      let loanDeduction = 0;
      if (activeLoan) {
        // Prélèvement automatique de 20% des revenus nets de la course
        const remainingToPay = activeLoan.montant - activeLoan.montantRembourse;
        loanDeduction = Math.min(Math.round(net * 0.20), remainingToPay); // Cannot deduct more than what is left
      }

      // -- TONTINE DEDUCTION --
      let tontineDeduction = 0;
      let activeTontineMember = await prisma.tontineMember.findFirst({
        where: { userId: req.driverId, group: { status: 'ACTIVE' } },
        include: { group: true }
      });

      if (activeTontineMember) {
        // If not already paid this period, deduct up to 100% of remaining net if needed?
        // We'll deduct 50% of net or less to not drain entirely, or a fixed chunk. Let's do fixed chunk up to 50% of net.
        const targetAmount = activeTontineMember.group.amountPerPeriod;
        // Simplified: take 50% of remaining net until target amount is hit for this cycle. 
        // Note: For a real app, we need to track "contributed this period" vs "totalContributed". We'll simplify to totalContributed.
        // Let's assume daily frequency.
        // Actually, just deduct 1000 CFA if possible, or 50% of net, whatever is smaller.
        tontineDeduction = Math.min(Math.round((net - loanDeduction) * 0.5), targetAmount);
      }
      
      const finalNet = net - loanDeduction - tontineDeduction;

      // Debit passenger
      await prisma.user.update({ where: { id: req.passengerId }, data: { walletBalance: { decrement: req.proposedPrice } } });
      // Credit driver (Final net)
      await prisma.user.update({ where: { id: req.driverId }, data: { walletBalance: { increment: finalNet } } });
      
      await prisma.transaction.create({
        data: { userId: req.passengerId, type: 'payment', amount: -req.proposedPrice, method: 'wave', status: 'completed', reference: req.id, description: `Paiement course` }
      });
      await prisma.transaction.create({
        data: { userId: req.driverId, type: 'payment', amount: req.proposedPrice, method: 'cash', status: 'completed', reference: req.id, description: `Gain course` }
      });
      await prisma.transaction.create({
        data: { userId: req.driverId, type: 'commission', amount: -(commission + taxAmount), method: 'cash', status: 'completed', reference: req.id, description: `Commission & Taxes (${(commRate * 100).toFixed(1)}% + ${(totalTaxRate * 100).toFixed(1)}%)` }
      });

      if (loanDeduction > 0 && activeLoan) {
        await prisma.transaction.create({
          data: { userId: req.driverId, type: 'payment', amount: -loanDeduction, method: 'wallet', status: 'completed', reference: req.id, description: `Remboursement automatique Micro-crédit` }
        });
        
        const updatedLoan = await prisma.loanRequest.update({
          where: { id: activeLoan.id },
          data: { montantRembourse: { increment: loanDeduction } }
        });
        
        // Check if fully paid
        if (updatedLoan.montantRembourse >= updatedLoan.montant) {
          await prisma.loanRequest.update({ where: { id: activeLoan.id }, data: { status: 'rembourse' } });
        }
      }

      if (tontineDeduction > 0 && activeTontineMember) {
        await prisma.transaction.create({
          data: { userId: req.driverId, type: 'payment', amount: -tontineDeduction, method: 'wallet', status: 'completed', reference: req.id, description: `Cotisation Tontine Nat` }
        });

        await prisma.tontineMember.update({
          where: { id: activeTontineMember.id },
          data: { totalContributed: { increment: tontineDeduction } }
        });

        const updatedGroup = await prisma.tontineGroup.update({
          where: { id: activeTontineMember.groupId },
          data: { cagnotte: { increment: tontineDeduction } },
          include: { members: true }
        });

        // Check if payout is ready (cagnotte >= total expected)
        const expectedTotal = updatedGroup.amountPerPeriod * updatedGroup.maxMembers;
        if (updatedGroup.cagnotte >= expectedTotal) {
          // Payout to currentTurnIndex
          const winner = updatedGroup.members.find(m => m.turnIndex === updatedGroup.currentTurnIndex);
          if (winner) {
            await prisma.user.update({
              where: { id: winner.userId },
              data: { walletBalance: { increment: expectedTotal } }
            });
            await prisma.transaction.create({
              data: { userId: winner.userId, type: 'topup', amount: expectedTotal, method: 'system', status: 'completed', reference: `TONTINE-${updatedGroup.id}`, description: `Gain Tontine Nat (Tour ${winner.turnIndex})` }
            });
            sendPushNotification(winner.userId, 'Tontine Gagnée !', `La cagnotte de ${expectedTotal} FCFA a été virée sur votre wallet.`);
            
            // Advance turn or complete
            let newStatus = 'ACTIVE';
            let nextTurn = updatedGroup.currentTurnIndex + 1;
            if (nextTurn > updatedGroup.maxMembers) {
              newStatus = 'COMPLETED'; // Tontine cycle finished
              nextTurn = 1;
            }
            
            await prisma.tontineGroup.update({
              where: { id: updatedGroup.id },
              data: { cagnotte: 0, currentTurnIndex: nextTurn, status: newStatus }
            });
            
            await prisma.tontineMember.update({
              where: { id: winner.id },
              data: { hasReceivedPayout: true }
            });
          }
        }
      }
    }

    const formattedReq = { ...req, createdAt: req.createdAt.getTime(), updatedAt: req.updatedAt.getTime() };
    io.emit('ride:updated', formattedReq);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- SUPPORT TICKETS APIS ---
app.post('/api/support/tickets', async (req, res) => {
  try {
    const { userId, subject, category, referenceId, initialMessage } = req.body;
    const ticket = await prisma.supportTicket.create({
      data: {
        userId, subject, category, referenceId,
        messages: {
          create: { senderId: userId, text: initialMessage }
        }
      },
      include: { messages: true }
    });
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/tickets/user/:userId', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.params.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/tickets', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { 
        messages: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        user: { select: { name: true, phone: true, role: true } }
      }
    });
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/tickets/:id/messages', async (req, res) => {
  try {
    const { senderId, text, isAdmin } = req.body;
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: req.params.id,
        senderId, text, isAdmin
      },
      include: { sender: { select: { name: true, role: true } } }
    });
    
    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date(), status: isAdmin ? 'IN_PROGRESS' : 'OPEN' }
    });
    
    // In a real app we'd emit via Socket.io to the specific user/admin room
    res.json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/support/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// --------------------

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
