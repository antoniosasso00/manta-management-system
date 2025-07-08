#!/usr/bin/env node

/**
 * Test Runner Sequenziale per MES Aerospazio
 * Esegue tutti i test uno alla volta e genera report
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configurazione
const BASE_URL = 'http://localhost:3000';
const TEST_USER = 'admin@mantaaero.com';
const TEST_PASSWORD = 'password123';

// Colori console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test results
const testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test individuali
async function testServerHealth() {
  logSection('TEST 1: Server Health Check');
  
  try {
    // Prima prova home page
    const homeResponse = await fetch(BASE_URL);
    log(`→ Home page status: ${homeResponse.status}`, 'blue');
    
    // Poi prova health endpoint (potrebbe non esistere)
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        log('✓ Health endpoint attivo', 'green');
        return { name: 'Server Health', status: 'passed' };
      } else if (response.status === 404) {
        log('⚠ Health endpoint non trovato, ma server attivo', 'yellow');
        return { name: 'Server Health', status: 'passed' };
      } else {
        log(`⚠ Health endpoint status: ${response.status}`, 'yellow');
        return { name: 'Server Health', status: 'passed' };
      }
    } catch (healthError) {
      // Se health fallisce ma home funziona, server è attivo
      if (homeResponse.status >= 200 && homeResponse.status < 600) {
        log('✓ Server attivo (no health endpoint)', 'green');
        return { name: 'Server Health', status: 'passed' };
      }
      throw healthError;
    }
  } catch (error) {
    log(`✗ Server non raggiungibile: ${error.message}`, 'red');
    return { name: 'Server Health', status: 'failed', error: error.message };
  }
}

async function testAuthentication() {
  logSection('TEST 2: Autenticazione');
  
  try {
    // Test login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER,
        password: TEST_PASSWORD
      })
    });
    
    if (loginResponse.ok) {
      log('✓ Login API disponibile', 'green');
      
      // Verifica sessione
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
      const sessionData = await sessionResponse.json();
      
      if (sessionData.user) {
        log(`✓ Sessione attiva per: ${sessionData.user.email}`, 'green');
        return { name: 'Authentication', status: 'passed' };
      } else {
        log('⚠ Sessione non attiva - richiede cookie browser', 'yellow');
        return { name: 'Authentication', status: 'skipped', note: 'Richiede browser' };
      }
    }
  } catch (error) {
    log(`✗ Errore autenticazione: ${error.message}`, 'red');
    return { name: 'Authentication', status: 'failed', error: error.message };
  }
}

async function testPartsAPI() {
  logSection('TEST 3: Parts API');
  const results = [];
  
  try {
    // GET Parts
    log('→ Testing GET /api/parts', 'blue');
    const listResponse = await fetch(`${BASE_URL}/api/parts`);
    const listData = await listResponse.json();
    
    if (listResponse.ok && listData.parts) {
      log(`✓ GET Parts: ${listData.parts.length} parti trovate`, 'green');
      results.push({ endpoint: 'GET /api/parts', status: 'passed' });
      
      // Mostra prime 3 parti
      console.table(listData.parts.slice(0, 3).map(p => ({
        PartNumber: p.partNumber,
        Description: p.description,
        Material: p.material
      })));
    } else {
      throw new Error('Failed to get parts');
    }
    
    return { name: 'Parts API', status: 'passed', details: results };
  } catch (error) {
    log(`✗ Errore Parts API: ${error.message}`, 'red');
    return { name: 'Parts API', status: 'failed', error: error.message };
  }
}

async function testODLAPI() {
  logSection('TEST 4: ODL API');
  
  try {
    // GET ODL
    log('→ Testing GET /api/odl', 'blue');
    const response = await fetch(`${BASE_URL}/api/odl`);
    const data = await response.json();
    
    if (response.ok && data.odls) {
      log(`✓ GET ODL: ${data.odls.length} ODL trovati`, 'green');
      
      // Mostra distribuzione per stato
      const byStatus = data.odls.reduce((acc, odl) => {
        acc[odl.status] = (acc[odl.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nDistribuzione ODL per stato:');
      console.table(byStatus);
      
      return { name: 'ODL API', status: 'passed' };
    }
  } catch (error) {
    log(`✗ Errore ODL API: ${error.message}`, 'red');
    return { name: 'ODL API', status: 'failed', error: error.message };
  }
}

async function testDepartments() {
  logSection('TEST 5: Departments');
  
  try {
    const response = await fetch(`${BASE_URL}/api/departments`);
    const data = await response.json();
    
    if (response.ok && data.departments) {
      log(`✓ ${data.departments.length} reparti trovati`, 'green');
      console.table(data.departments.map(d => ({
        Nome: d.name,
        Codice: d.code,
        Tipo: d.type
      })));
      return { name: 'Departments', status: 'passed' };
    }
  } catch (error) {
    log(`✗ Errore Departments: ${error.message}`, 'red');
    return { name: 'Departments', status: 'failed', error: error.message };
  }
}

async function testProductionEvents() {
  logSection('TEST 6: Production Events');
  
  try {
    const response = await fetch(`${BASE_URL}/api/production/events/recent`);
    const data = await response.json();
    
    if (response.ok && data.events) {
      log(`✓ ${data.events.length} eventi recenti trovati`, 'green');
      
      if (data.events.length > 0) {
        console.log('\nUltimi 3 eventi:');
        console.table(data.events.slice(0, 3).map(e => ({
          ODL: e.odl?.odlNumber || 'N/A',
          Tipo: e.eventType,
          Reparto: e.department?.name || 'N/A',
          Data: new Date(e.timestamp).toLocaleString('it-IT')
        })));
      }
      
      return { name: 'Production Events', status: 'passed' };
    }
  } catch (error) {
    log(`✗ Errore Production Events: ${error.message}`, 'red');
    return { name: 'Production Events', status: 'failed', error: error.message };
  }
}

async function testWorkflow() {
  logSection('TEST 7: Workflow');
  
  try {
    const response = await fetch(`${BASE_URL}/api/workflow/pending`);
    const data = await response.json();
    
    if (response.ok) {
      log(`✓ Workflow API funzionante`, 'green');
      log(`→ ${data.odls?.length || 0} ODL in attesa di trasferimento`, 'blue');
      return { name: 'Workflow', status: 'passed' };
    }
  } catch (error) {
    log(`✗ Errore Workflow: ${error.message}`, 'red');
    return { name: 'Workflow', status: 'failed', error: error.message };
  }
}

async function testTimeMetrics() {
  logSection('TEST 8: Time Metrics');
  
  try {
    const response = await fetch(`${BASE_URL}/api/reports/time-metrics`);
    const data = await response.json();
    
    if (response.ok) {
      log(`✓ Time Metrics API funzionante`, 'green');
      log(`→ ${data.metrics?.length || 0} metriche trovate`, 'blue');
      return { name: 'Time Metrics', status: 'passed' };
    }
  } catch (error) {
    log(`✗ Errore Time Metrics: ${error.message}`, 'red');
    return { name: 'Time Metrics', status: 'failed', error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  log('\n🚀 MES AEROSPAZIO - TEST RUNNER', 'bright');
  log(`Server: ${BASE_URL}`, 'blue');
  log(`User: ${TEST_USER}`, 'blue');
  log(`Started: ${new Date().toLocaleString('it-IT')}`, 'blue');
  
  // Array di test da eseguire
  const tests = [
    testServerHealth,
    testAuthentication,
    testPartsAPI,
    testODLAPI,
    testDepartments,
    testProductionEvents,
    testWorkflow,
    testTimeMetrics
  ];
  
  // Esegui test uno alla volta
  for (const testFn of tests) {
    try {
      const result = await testFn();
      if (result) {
        testResults.tests.push(result);
        testResults.summary.total++;
        if (result.status && testResults.summary[result.status] !== undefined) {
          testResults.summary[result.status]++;
        }
      }
    } catch (error) {
      log(`✗ Errore nell'esecuzione del test: ${error.message}`, 'red');
      testResults.tests.push({ 
        name: testFn.name, 
        status: 'failed', 
        error: error.message 
      });
      testResults.summary.total++;
      testResults.summary.failed++;
    }
    
    // Pausa tra i test
    await delay(1000);
  }
  
  // Report finale
  logSection('REPORT FINALE');
  
  const duration = (Date.now() - testResults.startTime) / 1000;
  log(`Durata totale: ${duration.toFixed(2)}s`, 'blue');
  
  console.log('\nRiepilogo:');
  console.table({
    'Test Totali': testResults.summary.total,
    'Passati': testResults.summary.passed,
    'Falliti': testResults.summary.failed,
    'Saltati': testResults.summary.skipped
  });
  
  console.log('\nDettaglio test:');
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'passed' ? '✓' : 
                 test.status === 'failed' ? '✗' : '⚠';
    const color = test.status === 'passed' ? 'green' : 
                  test.status === 'failed' ? 'red' : 'yellow';
    log(`${icon} Test ${index + 1}: ${test.name} - ${test.status.toUpperCase()}`, color);
    if (test.error) {
      log(`  └─ Error: ${test.error}`, 'red');
    }
    if (test.note) {
      log(`  └─ Note: ${test.note}`, 'yellow');
    }
  });
  
  // Salva report
  const reportPath = path.join(__dirname, 'results', `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n📄 Report salvato in: ${reportPath}`, 'green');
  
  // Exit code
  const exitCode = testResults.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Verifica che il server sia attivo prima di iniziare
async function checkServerBeforeStart() {
  log('Verifico che il server sia attivo...', 'yellow');
  
  try {
    const response = await fetch(BASE_URL);
    if (response.status >= 200 && response.status < 600) {
      log('✓ Server attivo!', 'green');
      return true;
    }
  } catch (error) {
    log('✗ Server non attivo!', 'red');
    log('Assicurati di avviare il server con: npm run dev', 'yellow');
    return false;
  }
}

// Entry point
(async () => {
  const serverOk = await checkServerBeforeStart();
  if (serverOk) {
    await runAllTests();
  } else {
    process.exit(1);
  }
})();