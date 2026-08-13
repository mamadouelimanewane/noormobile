const http = require('http');

console.log('--- Lancement des tests E2E NoorMobile ---');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[${method}] ${path} -> Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body || '{}'));
          } catch(e) { resolve(body) }
        } else {
          reject(new Error(`Failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', e => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n1. Test de l\'API Health Check...');
    const health = await testEndpoint('/api/health');
    console.log('✅ Health Check réussi:', health);

    console.log('\n2. Test de l\'API Surge Pricing...');
    const surge = await testEndpoint('/api/surge-pricing');
    console.log('✅ Surge Pricing réussi:', surge);

    console.log('\n3. Test de l\'API Noor AI (Simulation NLP)...');
    const ai = await testEndpoint('/api/ai/parse-intent', 'POST', { text: 'Trouve moi une voiture confort pour l\'aéroport' });
    console.log('✅ Noor AI réussi:', ai);

    console.log('\n3.5 Création d\'un utilisateur de test...');
    const auth = await testEndpoint('/api/auth/login', 'POST', { phone: '+221770000000', name: 'Test User', role: 'passager' });
    const userId = auth.user.id;
    console.log('✅ Utilisateur créé avec ID:', userId);

    console.log('\n4. Test du Webhook Stripe...');
    const stripe = await testEndpoint('/api/webhooks/stripe', 'POST', { userId: userId, amount: 5000, transactionId: 'txn_123', status: 'succeeded' });
    console.log('✅ Webhook Stripe réussi:', stripe);

    console.log('\n5. Test du Webhook Wave...');
    const wave = await testEndpoint('/api/webhooks/wave', 'POST', { userId: userId, amount: 2000, transactionId: 'wave_123', status: 'succeeded' });
    console.log('✅ Webhook Wave réussi:', wave);

    console.log('\n🎉 TOUS LES TESTS SONT AU VERT ! Le code est prêt pour la production.');
  } catch (err) {
    console.error('\n❌ ERREUR LORS DES TESTS:', err.message);
  }
}

// Attendre 2 secondes que le serveur démarre
setTimeout(runTests, 2000);
