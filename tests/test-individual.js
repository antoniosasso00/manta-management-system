#!/usr/bin/env node

/**
 * Test individuale per debug
 * Esegue test singoli per identificare problemi
 */

const BASE_URL = 'http://localhost:3000';

// Colori
const log = {
  info: (msg) => console.log(`\x1b[34m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m✗ ${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m⚠ ${msg}\x1b[0m`)
};

async function testBasicConnectivity() {
  console.log('\n=== TEST CONNETTIVITÀ BASE ===\n');
  
  // Test 1: Home page
  log.info('Test 1: Home page');
  try {
    const resp = await fetch(BASE_URL);
    log.info(`Status: ${resp.status}`);
    log.info(`Content-Type: ${resp.headers.get('content-type')}`);
    
    if (resp.status === 500) {
      const text = await resp.text();
      log.error('Server error: ' + text.substring(0, 100));
    } else if (resp.ok) {
      log.success('Home page accessibile');
    }
  } catch (e) {
    log.error('Errore connessione: ' + e.message);
  }
  
  // Test 2: Static asset
  log.info('\nTest 2: Static asset');
  try {
    const resp = await fetch(`${BASE_URL}/favicon.ico`);
    log.info(`Status: ${resp.status}`);
    if (resp.ok) {
      log.success('Static assets funzionanti');
    }
  } catch (e) {
    log.error('Errore: ' + e.message);
  }
  
  // Test 3: API base
  log.info('\nTest 3: API route base');
  try {
    const resp = await fetch(`${BASE_URL}/api`);
    log.info(`Status: ${resp.status}`);
    if (resp.status === 404) {
      log.warn('API base non definita (normale)');
    }
  } catch (e) {
    log.error('Errore: ' + e.message);
  }
  
  // Test 4: Auth check
  log.info('\nTest 4: Auth session check');
  try {
    const resp = await fetch(`${BASE_URL}/api/auth/session`);
    log.info(`Status: ${resp.status}`);
    const data = await resp.json();
    log.info('Session data: ' + JSON.stringify(data));
  } catch (e) {
    log.error('Errore: ' + e.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n\n=== TEST DATABASE ===\n');
  
  // Verifica se il database è accessibile tramite API
  log.info('Test connessione database via API');
  
  const endpoints = [
    '/api/departments',
    '/api/users',
    '/api/parts',
    '/api/odl'
  ];
  
  for (const endpoint of endpoints) {
    log.info(`\nTest ${endpoint}`);
    try {
      const resp = await fetch(`${BASE_URL}${endpoint}`);
      log.info(`Status: ${resp.status}`);
      
      if (resp.status === 500) {
        const text = await resp.text();
        if (text.includes('database') || text.includes('prisma')) {
          log.error('Probabile errore database');
        }
      } else if (resp.status === 401) {
        log.warn('Richiede autenticazione');
      } else if (resp.ok) {
        log.success('Endpoint funzionante');
      }
    } catch (e) {
      log.error('Errore: ' + e.message);
    }
  }
}

async function checkEnvironment() {
  console.log('\n\n=== CHECK AMBIENTE ===\n');
  
  // Suggerimenti per debug
  log.info('Verifica questi punti:');
  console.log('1. Database PostgreSQL attivo: docker ps | grep postgres');
  console.log('2. Redis attivo: docker ps | grep redis');
  console.log('3. Variabili ambiente: cat .env.local');
  console.log('4. Database migrato: npm run db:push');
  console.log('5. Database con seed: npm run db:seed-complete');
  console.log('6. Console Next.js per errori dettagliati');
}

// Main
(async () => {
  log.info('🔍 MES AEROSPAZIO - DEBUG TEST');
  log.info(`Server: ${BASE_URL}`);
  log.info(`Time: ${new Date().toLocaleString('it-IT')}`);
  
  await testBasicConnectivity();
  await testDatabaseConnection();
  await checkEnvironment();
  
  console.log('\n' + '='.repeat(50) + '\n');
  log.warn('NOTA: Per errori 500, controlla la console di Next.js');
  log.warn('NOTA: Per test completi, usa il browser dopo il login');
})();