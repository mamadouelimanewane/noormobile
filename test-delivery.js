import { io } from 'socket.io-client';

const API_URL = 'https://noordrive-api.onrender.com';
console.log(`Connexion à ${API_URL}...`);

// Chauffeur simulé
const driver = io(API_URL);
// Passager simulé
const passenger = io(API_URL);

let driverId = 'cm0000_delivery_driver';
let passengerId = 'cm0000_delivery_pass';
let currentRequest = null;
let currentOffer = null;

driver.on('connect', () => {
  console.log('✅ Driver connecté');
  driver.emit('driver:online', { driverId });
});

passenger.on('connect', () => {
  console.log('✅ Passenger connecté');
  
  // 1. Passager crée une demande de livraison
  console.log('📦 Création de la demande de livraison...');
  passenger.emit('ride:request', {
    type: 'delivery',
    passengerId,
    pickup: { lat: 14.6708, lng: -17.4381, label: 'Plateau (Expéditeur)' },
    dropoff: { lat: 14.7167, lng: -17.4677, label: 'Point E (Destinataire)' },
    proposedPrice: 2000,
    packageInfo: {
      description: 'Carton de documents',
      taille: 'petit',
      destinataireNom: 'Mamadou',
      destinatairePhone: '770001122'
    }
  });
});

driver.on('ride:new_request', (req) => {
  if (req.type === 'delivery') {
    console.log(`🔔 Chauffeur a reçu la livraison: ${req.pickupLabel} -> ${req.dropoffLabel} pour ${req.proposedPrice}F`);
    currentRequest = req;
    
    // 2. Chauffeur fait une offre
    console.log('💬 Chauffeur fait une offre...');
    driver.emit('ride:offer', {
      requestId: req.id,
      driverId,
      price: 2500,
      etaMin: 3
    });
  }
});

passenger.on('ride:new_offer', (offer) => {
  console.log(`💸 Passager reçoit une offre de ${offer.price}F de ${offer.driverName || 'le chauffeur'}`);
  currentOffer = offer;
  
  // 3. Passager accepte l'offre
  console.log('🤝 Passager accepte l\'offre...');
  passenger.emit('ride:accept', {
    requestId: offer.requestId,
    offerId: offer.id
  });
});

driver.on('ride:accepted', ({ request }) => {
  console.log('✅ Chauffeur voit que la livraison est acceptée !');
  
  // 4. Chauffeur signale qu'il a récupéré le colis
  console.log('🚗 Chauffeur récupère le colis (en route)...');
  setTimeout(() => {
    driver.emit('ride:status', {
      requestId: request.id,
      status: 'en_cours'
    });
  }, 1000);
});

passenger.on('ride:updated', (req) => {
  if (req.status === 'en_cours') {
    console.log('📍 Passager voit que le colis est en transit !');
    
    // 5. Chauffeur signale que le colis est livré
    setTimeout(() => {
      console.log('🏁 Chauffeur livre le colis...');
      driver.emit('ride:status', {
        requestId: req.id,
        status: 'termine'
      });
    }, 1000);
  }
  
  if (req.status === 'termine') {
    console.log('🎉 Livraison terminée avec succès (Fin du test) !');
    driver.disconnect();
    passenger.disconnect();
    process.exit(0);
  }
});

setTimeout(() => {
  console.error('TIMEOUT: Le test a pris trop de temps.');
  process.exit(1);
}, 60000);
