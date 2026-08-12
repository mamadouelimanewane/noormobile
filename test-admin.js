const axios = require('axios');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3005/api';
const SOCKET_URL = 'http://localhost:3005';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('--- TEST BACKOFFICE : VALIDATION ET GEOLOCALISATION ---');

  const driverPhone = `chauffeur_val_${Date.now()}`;

  // 1. Inscription d'un chauffeur
  console.log(`[1] Inscription d'un nouveau chauffeur (${driverPhone})...`);
  const driverRes = await axios.post(`${API_URL}/auth/login`, {
    phone: driverPhone,
    name: 'Moussa Le Chauffeur',
    role: 'chauffeur',
    vehicle: { marque: 'Peugeot', modele: '301', couleur: 'Gris', plaque: 'DK-0000' }
  });
  const driver = driverRes.data.user;
  console.log('✅ Chauffeur créé. Statut:', driver.accountStatus);

  if (driver.accountStatus !== 'PENDING') {
    console.error('❌ Le chauffeur devrait être PENDING !');
    process.exit(1);
  }

  // 2. Simulation Backoffice Admin : Récupération des PENDING
  console.log('[2] L\'Admin récupère la liste des chauffeurs en attente...');
  const pendingRes = await axios.get(`${API_URL}/admin/pending-drivers`);
  const pendingDrivers = pendingRes.data.users;
  console.log(`✅ Chauffeurs en attente trouvés: ${pendingDrivers.length}`);
  
  const targetDriver = pendingDrivers.find(d => d.id === driver.id);
  if (!targetDriver) {
    console.error('❌ Le chauffeur n\'apparaît pas dans la liste en attente !');
    process.exit(1);
  }

  // 3. Admin approuve le chauffeur
  console.log(`[3] L\'Admin approuve le chauffeur ${targetDriver.id}...`);
  const approveRes = await axios.post(`${API_URL}/admin/approve-driver`, { driverId: targetDriver.id });
  console.log('✅ Chauffeur approuvé. Nouveau statut:', approveRes.data.user.accountStatus);

  if (approveRes.data.user.accountStatus !== 'APPROVED') {
    console.error('❌ L\'approbation a échoué !');
    process.exit(1);
  }

  // 4. Simulation Carte en direct (Admin) & Déplacement (Chauffeur)
  console.log('[4] Connexion des WebSockets (Admin et Chauffeur)...');
  const adminSocket = io(SOCKET_URL);
  const driverSocket = io(SOCKET_URL, { auth: { userId: driver.id } });

  await new Promise(resolve => {
    let connected = 0;
    adminSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
    driverSocket.on('connect', () => { connected++; if(connected === 2) resolve(); });
  });

  // Admin écoute
  let locationsReceived = 0;
  adminSocket.on('driver:moved', (data) => {
    if (data.driverId === driver.id) {
      console.log(`📍 Backoffice reçoit la position : [${data.lat}, ${data.lng}]`);
      locationsReceived++;
      if (locationsReceived === 3) {
        console.log('✅ Suivi GPS sur le Backoffice validé !');
        console.log('--- TEST REUSSI ---');
        process.exit(0);
      }
    }
  });

  // Chauffeur bouge
  console.log('[5] Le Chauffeur se déplace...');
  driverSocket.emit('driver:location', { driverId: driver.id, lat: 14.6, lng: -17.4 });
  await delay(1000);
  driverSocket.emit('driver:location', { driverId: driver.id, lat: 14.61, lng: -17.41 });
  await delay(1000);
  driverSocket.emit('driver:location', { driverId: driver.id, lat: 14.62, lng: -17.42 });

  setTimeout(() => {
    if (locationsReceived < 3) {
      console.error('❌ Le Backoffice n\'a pas reçu toutes les positions.');
      process.exit(1);
    }
  }, 5000);
}

runTest().catch(console.error);
