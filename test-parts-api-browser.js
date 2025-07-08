#!/usr/bin/env node

/**
 * Test API Parts simulando richieste browser
 * 
 * Questo script simula le richieste che un browser farebbe dopo il login.
 * Per usarlo:
 * 1. Apri il browser e fai login su http://localhost:3000
 * 2. Apri DevTools (F12) -> Network -> trova una richiesta a /api/*
 * 3. Copia il valore del Cookie header
 * 4. Incollalo nella variabile AUTH_COOKIE sotto
 */

// IMPORTANTE: Sostituisci con il tuo cookie di sessione reale
const AUTH_COOKIE = 'authjs.csrf-token=YOUR_CSRF_TOKEN; authjs.callback-url=YOUR_CALLBACK; authjs.session-token=YOUR_SESSION_TOKEN';

const BASE_URL = 'http://localhost:3000';

// Colori per output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Dati di test
const testParts = [
  { partNumber: 'TEST001', description: 'Parte di test 001' },
  { partNumber: 'TEST002', description: 'Parte di test 002' },
  { partNumber: 'TEST003', description: 'Parte di test 003' },
];

let createdPartIds = [];

// Helper per richieste
async function apiRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Cookie': AUTH_COOKIE,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
}

// Test functions
async function testListParts() {
  log('\n📋 TEST: Lista Parti', 'bright');
  
  const result = await apiRequest('GET', '/api/parts?limit=5');
  
  if (result.ok) {
    log(`✅ Status: ${result.status}`, 'green');
    log(`✅ Trovate ${result.data.data.length} parti`, 'green');
    log(`✅ Totale: ${result.data.meta.total} parti nel database`, 'green');
  } else {
    log(`❌ Errore: ${result.status} - ${JSON.stringify(result.data)}`, 'red');
  }
  
  return result.ok;
}

async function testCreateParts() {
  log('\n➕ TEST: Creazione Parti', 'bright');
  
  for (const part of testParts) {
    const result = await apiRequest('POST', '/api/parts', part);
    
    if (result.ok) {
      createdPartIds.push(result.data.id);
      log(`✅ Creata parte ${part.partNumber} con ID: ${result.data.id}`, 'green');
    } else {
      log(`❌ Errore creazione ${part.partNumber}: ${JSON.stringify(result.data)}`, 'red');
    }
  }
  
  return createdPartIds.length > 0;
}

async function testGetPartById() {
  log('\n🔍 TEST: Recupero Parte per ID', 'bright');
  
  if (createdPartIds.length === 0) {
    log('⚠️  Nessuna parte creata, salto test', 'yellow');
    return false;
  }
  
  const partId = createdPartIds[0];
  const result = await apiRequest('GET', `/api/parts/${partId}`);
  
  if (result.ok) {
    log(`✅ Parte recuperata: ${result.data.partNumber} - ${result.data.description}`, 'green');
  } else {
    log(`❌ Errore: ${result.status} - ${JSON.stringify(result.data)}`, 'red');
  }
  
  return result.ok;
}

async function testUpdatePart() {
  log('\n✏️  TEST: Aggiornamento Parte', 'bright');
  
  if (createdPartIds.length === 0) {
    log('⚠️  Nessuna parte creata, salto test', 'yellow');
    return false;
  }
  
  const partId = createdPartIds[0];
  const updateData = { description: 'Descrizione aggiornata via test' };
  
  const result = await apiRequest('PUT', `/api/parts/${partId}`, updateData);
  
  if (result.ok) {
    log(`✅ Parte aggiornata: ${result.data.description}`, 'green');
  } else {
    log(`❌ Errore: ${result.status} - ${JSON.stringify(result.data)}`, 'red');
  }
  
  return result.ok;
}

async function testSearchParts() {
  log('\n🔎 TEST: Ricerca Parti', 'bright');
  
  const result = await apiRequest('GET', '/api/parts?search=TEST');
  
  if (result.ok) {
    log(`✅ Trovate ${result.data.data.length} parti con "TEST"`, 'green');
    result.data.data.forEach(part => {
      log(`   - ${part.partNumber}: ${part.description}`, 'cyan');
    });
  } else {
    log(`❌ Errore: ${result.status} - ${JSON.stringify(result.data)}`, 'red');
  }
  
  return result.ok;
}

async function testDeleteParts() {
  log('\n🗑️  TEST: Eliminazione Parti', 'bright');
  
  let allDeleted = true;
  
  for (const partId of createdPartIds) {
    const result = await apiRequest('DELETE', `/api/parts/${partId}`);
    
    if (result.ok) {
      log(`✅ Eliminata parte con ID: ${partId}`, 'green');
    } else {
      log(`❌ Errore eliminazione ${partId}: ${JSON.stringify(result.data)}`, 'red');
      allDeleted = false;
    }
  }
  
  return allDeleted;
}

// Main test runner
async function runTests() {
  log('\n🚀 TEST API PARTS - MODALITÀ BROWSER', 'bright');
  log('=====================================\n', 'bright');
  
  if (AUTH_COOKIE.includes('YOUR_')) {
    log('❌ ERRORE: Devi prima configurare AUTH_COOKIE!', 'red');
    log('\nIstruzioni:', 'yellow');
    log('1. Apri http://localhost:3000 nel browser', 'yellow');
    log('2. Fai login con admin@mantaaero.com / password123', 'yellow');
    log('3. Apri DevTools (F12) -> Network', 'yellow');
    log('4. Ricarica la pagina e trova una richiesta a /api/*', 'yellow');
    log('5. Copia il valore del header "Cookie"', 'yellow');
    log('6. Incollalo nella variabile AUTH_COOKIE in questo file', 'yellow');
    return;
  }
  
  const tests = [
    { name: 'Lista Parti', fn: testListParts },
    { name: 'Creazione Parti', fn: testCreateParts },
    { name: 'Recupero per ID', fn: testGetPartById },
    { name: 'Aggiornamento', fn: testUpdatePart },
    { name: 'Ricerca', fn: testSearchParts },
    { name: 'Eliminazione', fn: testDeleteParts },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
      else failed++;
    } catch (error) {
      log(`❌ Errore in ${test.name}: ${error.message}`, 'red');
      failed++;
    }
  }
  
  // Riepilogo
  log('\n=====================================', 'bright');
  log('📊 RIEPILOGO TEST', 'bright');
  log('=====================================\n', 'bright');
  log(`✅ Test passati: ${passed}`, 'green');
  log(`❌ Test falliti: ${failed}`, 'red');
  log(`📈 Totale: ${passed + failed}`, 'blue');
  
  if (failed === 0) {
    log('\n🎉 Tutti i test sono passati!', 'green');
  } else {
    log('\n⚠️  Alcuni test sono falliti', 'yellow');
  }
}

// Istruzioni alternative
function printAlternativeInstructions() {
  log('\n📝 METODI ALTERNATIVI PER TESTARE LE API:', 'bright');
  log('\n1. USA POSTMAN:', 'cyan');
  log('   - Importa la collection dal browser (F12 -> Network -> Copy as cURL)', 'yellow');
  log('   - Postman gestirà automaticamente i cookie di sessione', 'yellow');
  
  log('\n2. USA INSOMNIA:', 'cyan');
  log('   - Simile a Postman ma più leggero', 'yellow');
  log('   - Supporta import di cURL commands', 'yellow');
  
  log('\n3. USA THUNDER CLIENT (VS Code):', 'cyan');
  log('   - Estensione VS Code per testare API', 'yellow');
  log('   - Integrato nell\'editor', 'yellow');
  
  log('\n4. CREA UN TOKEN JWT DI TEST:', 'cyan');
  log('   - Aggiungi un middleware che accetta un token di test in development', 'yellow');
  log('   - Esempio: Authorization: Bearer TEST_TOKEN', 'yellow');
}

// Run
runTests().then(() => {
  printAlternativeInstructions();
}).catch(error => {
  log(`\n❌ Errore fatale: ${error.message}`, 'red');
  process.exit(1);
});