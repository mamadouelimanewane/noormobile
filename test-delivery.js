const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://noordrive-api.onrender.com/api';
const SOCKET_URL = 'https://noordrive-api.onrender.com';

async function runTest() {
  console.log('--- DEBUT DU TEST LIVRAISON ---');
  
  const pPhone = `passager_${Date.now()}`;
  const dPhone = `chauffeur_${Date.now()}`;

  // 1. Inscriptions
  console.log('[1] Création des utilisateurs...');
  const resP = await axios.post(`${API_URL}/auth/login`, { phone: pPhone, name: 'Expéditeur', role: 'passager' });
  const passenger = resP.data.user;
  const resD = await axios.post(`${API_URL}/auth/login`, { 
    phone: dPhone, name: 'Livreur', role: 'chauffeur', 
    vehicle: { marque: 'Yamaha', modele: 'Moto', couleur: 'Noir', plaque: 'DK-MOTO' } 
  });
  const driver = resD.data.user;

  console.log('✅ Utilisateurs créés.');

  // 2. Sockets
  const pSocket = io(SOCKET_URL, { auth: { userId: passenger.id } });
  const dSocket = io(SOCKET_URL, { auth: { userId: driver.id } });

  await new Promise(resolve => {
    let connected = 0;
    const check = () => { connected++; if(connected===2) resolve(); }
    pSocket.on('connect', check);
    dSocket.on('connect', check);
  });
  console.log('✅ Sockets connectés.');

  dSocket.emit('driver:online', { driverId: driver.id });

  await new Promise(r => setTimeout(r, 1000));

  let currentRequest = null;
  let currentOffer = null;

  dSocket.on('ride:new_request', (req) => {
    if (req.type === 'delivery') {
      console.log(`🔔 Chauffeur a reçu la livraison: ${req.pickupLabel} -> ${req.dropoffLabel} pour ${req.proposedPrice}F`);
      currentRequest = req;
      dSocket.emit('ride:offer', { requestId: req.id, driverId: driver.id, price: 2500, etaMin: 3 });
    }
  });

  pSocket.on('ride:new_offer', (offer) => {
    console.log(`💸 Passager reçoit une offre de ${offer.price}F`);
    currentOffer = offer;
    pSocket.emit('ride:accept', { requestId: offer.requestId, offerId: offer.id });
  });

  dSocket.on('ride:accepted', ({ request }) => {
    console.log('✅ Chauffeur voit que la livraison est acceptée !');
    setTimeout(() => {
      dSocket.emit('ride:status', { requestId: request.id, status: 'en_cours' });
    }, 1000);
  });

  pSocket.on('ride:updated', (req) => {
    if (req.status === 'en_cours') {
      console.log('📍 Passager voit que le colis est en transit !');
      setTimeout(() => {
        dSocket.emit('ride:status', { requestId: req.id, status: 'termine' });
      }, 1000);
    }
    
    if (req.status === 'termine') {
      console.log('🎉 Livraison terminée avec succès !');
      process.exit(0);
    }
  });

  // 3. Demande de livraison
  pSocket.emit('ride:request', {
    type: 'delivery', passengerId: passenger.id,
    pickup: { lat: 14.6708, lng: -17.4381, label: 'Plateau' },
    dropoff: { lat: 14.7167, lng: -17.4677, label: 'Point E' },
    proposedPrice: 2000,
    packageInfo: { description: 'Carton', taille: 'petit', destinataireNom: 'Mamadou', destinatairePhone: '770001122' }
  });

  setTimeout(() => {
    console.error('TIMEOUT');
    process.exit(1);
  }, 15000);
}

runTest().catch(console.error);
