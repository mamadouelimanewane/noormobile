const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'https://noordrive-api.onrender.com/api';
const SOCKET_URL = 'https://noordrive-api.onrender.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- TEST DES FONCTIONNALITES AVANCEES ---');

  const passengerPhone = `passager_test_${Date.now()}`;
  const driverPhone = `chauffeur_test_${Date.now()}`;

  // 1. Inscription
  console.log(`[1] Création des comptes...`);
  const passagerRes = await axios.post(`${API_URL}/auth/login`, { phone: passengerPhone, name: 'Client Test', role: 'passager' });
  const passenger = passagerRes.data.user;
  
  const driverRes = await axios.post(`${API_URL}/auth/login`, { phone: driverPhone, name: 'Chauffeur Test', role: 'chauffeur', vehicle: { marque: 'BMW', modele: 'X5', couleur: 'Noir', plaque: 'DK-9999' } });
  const driver = driverRes.data.user;

  // 2. Test des Wallets (Rechargement)
  console.log(`[2] Rechargement des portefeuilles (Topup)...`);
  
  const topupPassenger = await axios.post(`${API_URL}/wallet/topup`, {
    userId: passenger.id,
    amount: 10000,
    method: 'wave'
  });
  console.log(`✅ Portefeuille Passager rechargé : Nouveau solde = ${topupPassenger.data.user.walletBalance} FCFA`);

  const topupDriver = await axios.post(`${API_URL}/wallet/topup`, {
    userId: driver.id,
    amount: 5000,
    method: 'orange_money'
  });
  console.log(`✅ Portefeuille Chauffeur rechargé : Nouveau solde = ${topupDriver.data.user.walletBalance} FCFA`);

  // 3. Test de Cashout
  console.log(`[3] Retrait d'argent (Cashout)...`);
  const cashoutDriver = await axios.post(`${API_URL}/wallet/cashout`, {
    userId: driver.id,
    amount: 2000,
    method: 'orange_money'
  });
  console.log(`✅ Retrait Chauffeur réussi : Nouveau solde = ${cashoutDriver.data.user.walletBalance} FCFA`);

  // 4. Test de Géolocalisation et Itinéraire
  console.log('[4] Connexion des WebSockets pour le suivi d\'itinéraire...');
  const passagerSocket = io(SOCKET_URL, { auth: { userId: passenger.id } });
  const driverSocket = io(SOCKET_URL, { auth: { userId: driver.id } });

  await new Promise(resolve => {
    let connected = 0;
    passagerSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
    driverSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
  });

  // Simulation d'itinéraire (Déplacement du chauffeur)
  const route = [
    { lat: 14.6920, lng: -17.4460 },
    { lat: 14.6935, lng: -17.4475 },
    { lat: 14.6950, lng: -17.4490 },
    { lat: 14.6975, lng: -17.4515 }
  ];

  let receivedPositions = 0;

  passagerSocket.on('driver:moved', (data) => {
    if (data.driverId === driver.id) {
      console.log(`📍 Passager a reçu la nouvelle position du chauffeur : [${data.lat}, ${data.lng}]`);
      receivedPositions++;
      if (receivedPositions === route.length) {
        console.log('✅ Suivi d\'itinéraire testé avec succès.');
        console.log('--- TEST REUSSI ---');
        process.exit(0);
      }
    }
  });

  console.log('[5] Chauffeur commence à se déplacer (envoi des coordonnées GPS en temps réel)...');
  for (const pos of route) {
    driverSocket.emit('driver:location', { driverId: driver.id, lat: pos.lat, lng: pos.lng });
    await delay(1000); // 1 seconde entre chaque position
  }

  // Timeout de sécurité
  setTimeout(() => {
    if (receivedPositions < route.length) {
      console.error('❌ Le test de géolocalisation a expiré (coordonnées manquantes) !');
      process.exit(1);
    }
  }, 10000);
}

runTest().catch(console.error);
