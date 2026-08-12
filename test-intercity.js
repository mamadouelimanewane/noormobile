const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://noordrive-api.onrender.com/api';
const SOCKET_URL = 'https://noordrive-api.onrender.com';

async function runTest() {
  console.log('--- DEBUT DU TEST COVOITURAGE (INTERCITY) ---');

  const p1Phone = `pass1_${Date.now()}`;
  const p2Phone = `pass2_${Date.now()}`;
  const driverPhone = `chauffeur_${Date.now()}`;

  // 1. Inscriptions
  console.log('[1] Création des utilisateurs...');
  const res1 = await axios.post(`${API_URL}/auth/login`, { phone: p1Phone, name: 'Passager 1', role: 'passager' });
  const p1 = res1.data.user;
  const res2 = await axios.post(`${API_URL}/auth/login`, { phone: p2Phone, name: 'Passager 2', role: 'passager' });
  const p2 = res2.data.user;
  const resD = await axios.post(`${API_URL}/auth/login`, { 
    phone: driverPhone, name: 'Chauffeur', role: 'chauffeur', 
    vehicle: { marque: 'Peugeot', modele: '508', couleur: 'Noir', plaque: 'DK-INT' } 
  });
  const driver = resD.data.user;

  console.log('✅ Utilisateurs créés.');

  // 2. Sockets
  const dSocket = io(SOCKET_URL, { auth: { userId: driver.id } });
  const p1Socket = io(SOCKET_URL, { auth: { userId: p1.id } });
  const p2Socket = io(SOCKET_URL, { auth: { userId: p2.id } });

  await new Promise(resolve => {
    let connected = 0;
    const check = () => { connected++; if(connected===3) resolve(); }
    dSocket.on('connect', check);
    p1Socket.on('connect', check);
    p2Socket.on('connect', check);
  });
  console.log('✅ Sockets connectés.');

  dSocket.emit('driver:online', { driverId: driver.id });
  
  await new Promise(r => setTimeout(r, 1000));

  let acceptedCount = 0;

  dSocket.on('ride:new_request', (req) => {
    if (req.type === 'intercity') {
      console.log(`🔔 Chauffeur reçoit demande: ${req.pickupLabel} -> ${req.dropoffLabel} pour ${req.proposedPrice}F`);
      dSocket.emit('ride:offer', { requestId: req.id, driverId: driver.id, price: req.proposedPrice, etaMin: 5 });
    }
  });

  p1Socket.on('ride:new_offer', (offer) => {
    console.log(`🤝 P1 accepte l'offre de ${offer.price}F`);
    p1Socket.emit('ride:accept', { requestId: offer.requestId, offerId: offer.id });
  });

  p2Socket.on('ride:new_offer', (offer) => {
    console.log(`🤝 P2 accepte l'offre de ${offer.price}F`);
    p2Socket.emit('ride:accept', { requestId: offer.requestId, offerId: offer.id });
  });

  dSocket.on('ride:accepted', ({ request }) => {
    acceptedCount++;
    console.log(`✅ Chauffeur voit la course acceptée (${acceptedCount}/2) !`);
    if (acceptedCount === 2) {
      console.log('🚗 Chauffeur a 2 clients ! Il part vers la destination...');
      setTimeout(() => {
        console.log('🏁 Covoiturage testé avec succès (plusieurs passagers reçus) !');
        process.exit(0);
      }, 1000);
    }
  });

  // 3. Demandes
  p1Socket.emit('ride:request', {
    type: 'intercity', passengerId: p1.id,
    pickup: { lat: 14.6708, lng: -17.4381, label: 'Dakar (Plateau)' },
    dropoff: { lat: 14.792, lng: -16.935, label: 'Thiès' },
    proposedPrice: 2000,
    intercityInfo: { villeDepart: 'Dakar', villeArrivee: 'Thiès', dateDepart: '2026-08-15', places: 1 }
  });

  setTimeout(() => {
    p2Socket.emit('ride:request', {
      type: 'intercity', passengerId: p2.id,
      pickup: { lat: 14.7167, lng: -17.4677, label: 'Dakar (Point E)' },
      dropoff: { lat: 14.792, lng: -16.935, label: 'Thiès' },
      proposedPrice: 4000,
      intercityInfo: { villeDepart: 'Dakar', villeArrivee: 'Thiès', dateDepart: '2026-08-15', places: 2 }
    });
  }, 1000);

  setTimeout(() => {
    console.error('TIMEOUT');
    process.exit(1);
  }, 15000);
}

runTest().catch(console.error);
