const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://noordrive-api.onrender.com/api';
const SOCKET_URL = 'https://noordrive-api.onrender.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- DEBUT DU TEST E2E ---');

  const passengerPhone = `passager_${Date.now()}`;
  const driverPhone = `chauffeur_${Date.now()}`;

  // 1. Inscription du passager
  console.log(`[1] Inscription Passager (${passengerPhone})...`);
  const passagerRes = await axios.post(`${API_URL}/auth/login`, {
    phone: passengerPhone,
    name: 'Alice Passager',
    role: 'passager'
  });
  const passenger = passagerRes.data.user;
  console.log('✅ Passager créé:', passenger.id);

  // 2. Inscription du chauffeur
  console.log(`[2] Inscription Chauffeur (${driverPhone})...`);
  const driverRes = await axios.post(`${API_URL}/auth/login`, {
    phone: driverPhone,
    name: 'Bob Chauffeur',
    role: 'chauffeur',
    vehicle: {
      marque: 'Toyota',
      modele: 'Corolla',
      couleur: 'Blanc',
      plaque: 'DK-TEST'
    }
  });
  const driver = driverRes.data.user;
  console.log('✅ Chauffeur créé:', driver.id);

  // 3. Connexion WebSockets
  console.log('[3] Connexion des WebSockets...');
  const passagerSocket = io(SOCKET_URL, { auth: { userId: passenger.id } });
  const driverSocket = io(SOCKET_URL, { auth: { userId: driver.id } });

  await new Promise(resolve => {
    let connected = 0;
    passagerSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
    driverSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
  });
  console.log('✅ Sockets connectés');

  // Mettre le chauffeur en ligne
  driverSocket.emit('driver:online', { driverId: driver.id });
  await delay(1000); // Give time for the backend to join the driver to the room

  let requestId = null;
  let offerId = null;

  // Listeners pour le flux
  driverSocket.on('ride:new_request', (req) => {
    console.log('✅ Chauffeur a reçu la demande:', req.id);
    requestId = req.id;
    
    console.log('[5] Chauffeur fait une offre (2500 FCFA)...');
    driverSocket.emit('ride:offer', { requestId: req.id, driverId: driver.id, price: 2500, etaMin: 5 });
  });

  passagerSocket.on('ride:new_offer', (offer) => {
    console.log('✅ Passager a reçu l\'offre:', offer.id);
    offerId = offer.id;

    console.log('[6] Passager accepte l\'offre...');
    passagerSocket.emit('ride:accept', { requestId, offerId });
  });

  driverSocket.on('ride:accepted', ({ request }) => {
    console.log('✅ Course acceptée. Statut:', request.status);
    
    console.log('[7] Chauffeur démarre la course...');
    driverSocket.emit('ride:status', { requestId, status: 'en_cours' });

    setTimeout(() => {
      console.log('[8] Chauffeur termine la course (Paiement automatique)...');
      driverSocket.emit('ride:status', { requestId, status: 'termine' });
    }, 2000);
  });

  passagerSocket.on('ride:updated', (req) => {
    if (req.status === 'en_cours') {
      console.log('✅ Passager voit la course démarrer');
    }
    if (req.status === 'termine') {
      console.log('✅ Passager voit la course terminée');
      console.log('--- TEST REUSSI ---');
      process.exit(0);
    }
  });

  // 4. Passager crée une demande
  console.log('[4] Passager crée une demande de course...');
  passagerSocket.emit('ride:request', {
    type: 'classique',
    passengerId: passenger.id,
    proposedPrice: 2000,
    pickup: { lat: 14.692, lng: -17.446, label: 'Point A' },
    dropoff: { lat: 14.700, lng: -17.450, label: 'Point B' }
  });

  // Timeout de sécurité
  setTimeout(() => {
    console.error('❌ Le test a expiré !');
    process.exit(1);
  }, 15000);
}

runTest().catch(console.error);
