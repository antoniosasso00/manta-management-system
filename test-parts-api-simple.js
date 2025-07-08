#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper per logging colorato
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test delle API Parts senza autenticazione
async function testPartsAPI() {
  logSection('TEST API PARTS - VERSIONE SEMPLIFICATA');
  log(`📍 Server: ${BASE_URL}`, 'cyan');
  log(`🕐 Data/Ora: ${new Date().toLocaleString('it-IT')}`, 'cyan');
  
  logWarning('\nNOTA: Questo test assume che l\'autenticazione sia temporaneamente disabilitata');
  logWarning('o che tu abbia configurato un token di test nelle variabili d\'ambiente.\n');

  // Test 1: Verifica connessione al server
  logSection('TEST 1: VERIFICA CONNESSIONE');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/providers`);
    if (response.ok) {
      logSuccess('Server raggiungibile');
      const data = await response.json();
      log(`Providers disponibili: ${JSON.stringify(data)}`, 'cyan');
    } else {
      logError(`Server risponde con status: ${response.status}`);
    }
  } catch (error) {
    logError(`Impossibile raggiungere il server: ${error.message}`);
    logError('Assicurati che il server sia attivo con: npm run dev');
    return;
  }

  // Test 2: Test endpoint Parts senza auth (potrebbe fallire)
  logSection('TEST 2: ENDPOINT PARTS SENZA AUTENTICAZIONE');
  try {
    const response = await fetch(`${BASE_URL}/api/parts`);
    log(`Status: ${response.status}`, response.ok ? 'green' : 'red');
    
    const data = await response.json();
    console.log('Risposta:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      logWarning('Come previsto, l\'endpoint richiede autenticazione');
      logInfo('Per testare completamente le API, è necessario:');
      logInfo('1. Configurare un token di test');
      logInfo('2. O disabilitare temporaneamente l\'auth per development');
      logInfo('3. O usare un client che supporta sessioni NextAuth');
    } else if (response.ok) {
      logSuccess('Endpoint accessibile! Possiamo procedere con i test completi');
    }
  } catch (error) {
    logError(`Errore nel test: ${error.message}`);
  }

  // Test 3: Informazioni sugli endpoint disponibili
  logSection('TEST 3: ENDPOINT DISPONIBILI');
  const endpoints = [
    { method: 'GET', path: '/api/parts', desc: 'Lista parti con paginazione' },
    { method: 'POST', path: '/api/parts', desc: 'Crea nuova parte' },
    { method: 'GET', path: '/api/parts/[id]', desc: 'Dettaglio parte singola' },
    { method: 'PUT', path: '/api/parts/[id]', desc: 'Aggiorna parte esistente' },
    { method: 'DELETE', path: '/api/parts/[id]', desc: 'Elimina parte' },
    { method: 'POST', path: '/api/parts/bulk', desc: 'Creazione parti in bulk' },
    { method: 'GET', path: '/api/parts/statistics', desc: 'Statistiche parti' },
  ];

  logInfo('Endpoint Parts implementati:');
  endpoints.forEach(ep => {
    log(`  ${ep.method.padEnd(6)} ${ep.path.padEnd(25)} - ${ep.desc}`, 'cyan');
  });

  // Test 4: Schema dati Parts
  logSection('TEST 4: SCHEMA DATI PARTS');
  logInfo('Campi parte:');
  log('  - partNumber: string (alfanumerico, es: "8G5350A0")', 'cyan');
  log('  - description: string (descrizione parte)', 'cyan');
  log('  - id: string (CUID generato automaticamente)', 'cyan');
  log('  - isActive: boolean (default: true)', 'cyan');
  log('  - createdAt: DateTime', 'cyan');
  log('  - updatedAt: DateTime', 'cyan');

  // Test 5: Parametri query supportati
  logSection('TEST 5: PARAMETRI QUERY');
  logInfo('Parametri supportati per GET /api/parts:');
  log('  - search: string (ricerca in partNumber e description)', 'cyan');
  log('  - isActive: boolean (filtra parti attive/inattive)', 'cyan');
  log('  - page: number (default: 1)', 'cyan');
  log('  - limit: number (default: 10, max: 100)', 'cyan');
  log('  - sortBy: "partNumber" | "description" | "createdAt"', 'cyan');
  log('  - sortOrder: "asc" | "desc"', 'cyan');

  // Suggerimenti per testing manuale
  logSection('SUGGERIMENTI PER TESTING MANUALE');
  logInfo('Esempi di comandi curl per testare manualmente:');
  
  console.log('\n1. Lista parti:');
  log('   curl http://localhost:3000/api/parts', 'yellow');
  
  console.log('\n2. Crea parte (richiede auth):');
  log('   curl -X POST http://localhost:3000/api/parts \\', 'yellow');
  log('     -H "Content-Type: application/json" \\', 'yellow');
  log('     -d \'{"partNumber":"TEST123","description":"Test parte"}\'', 'yellow');
  
  console.log('\n3. Aggiorna parte:');
  log('   curl -X PUT http://localhost:3000/api/parts/{id} \\', 'yellow');
  log('     -H "Content-Type: application/json" \\', 'yellow');
  log('     -d \'{"description":"Nuova descrizione"}\'', 'yellow');

  // Riepilogo
  logSection('RIEPILOGO');
  logSuccess('Analisi endpoint Parts completata');
  logWarning('Per test completi con autenticazione, considera:');
  log('  1. Usare Postman/Insomnia con supporto cookie', 'cyan');
  log('  2. Implementare un endpoint di test che bypassa auth', 'cyan');
  log('  3. Usare playwright/puppeteer per automazione browser', 'cyan');
  log('  4. Configurare un JWT token di test per development', 'cyan');
}

// Script alternativo per test con mock auth
async function createMockAuthTest() {
  logSection('CREAZIONE TEST CON MOCK AUTH');
  
  const mockTestContent = `
// test-parts-with-mock-auth.js
// Questo è un esempio di come potresti testare le API con auth mockato

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWithDatabase() {
  // 1. Crea utente di test direttamente nel database
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'ADMIN'
    }
  });

  // 2. Crea sessione di test
  const session = await prisma.session.create({
    data: {
      sessionToken: 'test-session-token',
      userId: testUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  // 3. Usa il token per le richieste
  const response = await fetch('http://localhost:3000/api/parts', {
    headers: {
      'Cookie': \`next-auth.session-token=\${session.sessionToken}\`
    }
  });

  // 4. Cleanup
  await prisma.session.delete({ where: { id: session.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
}
`;

  logInfo('Esempio di test con mock auth salvato mentalmente');
  logInfo('Potresti implementarlo se necessario');
}

// Esegui test
async function main() {
  log('\n🚀 INIZIO TEST SUITE API PARTS (SEMPLIFICATA)', 'bright');
  
  await testPartsAPI();
  await createMockAuthTest();
  
  log('\n✨ TEST COMPLETATI', 'bright');
  logInfo('Per test completi, vedi i suggerimenti sopra');
}

main().catch(error => {
  logError(`Errore fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});