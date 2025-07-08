#!/usr/bin/env node

/**
 * Test completo delle API MES Aerospazio usando cookie di sessione
 * 
 * ISTRUZIONI:
 * 1. Apri Chrome e vai su http://localhost:3000
 * 2. Fai login con admin@mantaaero.com / password123
 * 3. Apri DevTools (F12) > Application > Cookies
 * 4. Copia il valore del cookie 'authjs.session-token'
 * 5. Sostituisci SESSION_COOKIE sotto con il valore copiato
 * 6. Esegui: node test-with-cookies.js
 */

const SESSION_COOKIE = 'INSERISCI_QUI_IL_COOKIE_SESSION_TOKEN';

// Colori per output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper per fare richieste autenticate
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Cookie': `authjs.session-token=${SESSION_COOKIE}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { response, data };
  } catch (error) {
    console.error(`${colors.red}Errore fetch:${colors.reset}`, error.message);
    throw error;
  }
}

// Test suite
async function runTests() {
  console.log(`${colors.bright}${colors.blue}=== TEST MES AEROSPAZIO API ===${colors.reset}\n`);

  if (SESSION_COOKIE === 'INSERISCI_QUI_IL_COOKIE_SESSION_TOKEN') {
    console.log(`${colors.red}⚠️  ATTENZIONE: Devi inserire il cookie di sessione!${colors.reset}`);
    console.log(`${colors.yellow}Segui le istruzioni nel file per ottenere il cookie.${colors.reset}\n`);
    return;
  }

  const baseUrl = 'http://localhost:3000';
  let createdPartId = null;
  let createdOdlId = null;

  // 1. TEST PARTS API
  console.log(`${colors.cyan}📦 TEST PARTS API${colors.reset}`);
  
  // GET /api/parts
  console.log('\n➤ GET /api/parts');
  const { response: listResp, data: listData } = await fetchWithAuth(`${baseUrl}/api/parts`);
  console.log(`Status: ${listResp.status}`);
  console.log(`Parts trovate: ${listData?.parts?.length || 0}`);
  if (listData?.parts?.[0]) {
    console.log(`Prima parte: ${listData.parts[0].partNumber} - ${listData.parts[0].description}`);
  }

  // POST /api/parts
  console.log('\n➤ POST /api/parts');
  const newPart = {
    partNumber: `TEST-${Date.now()}`,
    description: 'Test Part Automated',
    material: 'CFRP',
    category: 'STRUCTURAL',
    aerospaceStandard: 'AS9100',
    isActive: true
  };
  
  const { response: createResp, data: createData } = await fetchWithAuth(`${baseUrl}/api/parts`, {
    method: 'POST',
    body: JSON.stringify(newPart)
  });
  
  console.log(`Status: ${createResp.status}`);
  if (createResp.ok) {
    createdPartId = createData.part.id;
    console.log(`${colors.green}✓ Parte creata: ${createData.part.partNumber} (ID: ${createdPartId})${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Errore: ${createData?.error || 'Sconosciuto'}${colors.reset}`);
  }

  // GET /api/parts/[id]
  if (createdPartId) {
    console.log(`\n➤ GET /api/parts/${createdPartId}`);
    const { response: getResp, data: getData } = await fetchWithAuth(`${baseUrl}/api/parts/${createdPartId}`);
    console.log(`Status: ${getResp.status}`);
    if (getResp.ok) {
      console.log(`${colors.green}✓ Parte recuperata: ${getData.part.partNumber}${colors.reset}`);
    }
  }

  // PUT /api/parts/[id]
  if (createdPartId) {
    console.log(`\n➤ PUT /api/parts/${createdPartId}`);
    const updateData = {
      description: 'Test Part Updated',
      material: 'AL7075'
    };
    
    const { response: updateResp, data: updateRespData } = await fetchWithAuth(`${baseUrl}/api/parts/${createdPartId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    console.log(`Status: ${updateResp.status}`);
    if (updateResp.ok) {
      console.log(`${colors.green}✓ Parte aggiornata${colors.reset}`);
    }
  }

  // 2. TEST ODL API
  console.log(`\n\n${colors.cyan}📋 TEST ODL API${colors.reset}`);
  
  // GET /api/odl
  console.log('\n➤ GET /api/odl');
  const { response: odlListResp, data: odlListData } = await fetchWithAuth(`${baseUrl}/api/odl`);
  console.log(`Status: ${odlListResp.status}`);
  console.log(`ODL trovati: ${odlListData?.odls?.length || 0}`);
  
  // POST /api/odl
  console.log('\n➤ POST /api/odl');
  const partForOdl = listData?.parts?.[0];
  if (partForOdl) {
    const newOdl = {
      partId: partForOdl.id,
      quantity: 5,
      priority: 'NORMAL',
      gammaId: `GM-TEST-${Date.now()}`
    };
    
    const { response: createOdlResp, data: createOdlData } = await fetchWithAuth(`${baseUrl}/api/odl`, {
      method: 'POST',
      body: JSON.stringify(newOdl)
    });
    
    console.log(`Status: ${createOdlResp.status}`);
    if (createOdlResp.ok) {
      createdOdlId = createOdlData.odl.id;
      console.log(`${colors.green}✓ ODL creato: ${createOdlData.odl.odlNumber} (ID: ${createdOdlId})${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Errore: ${createOdlData?.error || 'Sconosciuto'}${colors.reset}`);
    }
  }

  // 3. TEST PRODUCTION EVENTS
  console.log(`\n\n${colors.cyan}🏭 TEST PRODUCTION EVENTS${colors.reset}`);
  
  if (createdOdlId) {
    console.log('\n➤ POST /api/production/events (Ingresso Clean Room)');
    const eventData = {
      odlId: createdOdlId,
      departmentId: 'clngw4dik0001iko0vxcy6y5y', // Clean Room ID dal seed
      eventType: 'ENTRY',
      operatorId: 'clngw4dik000diko00fmo5cxm', // Operatore Clean Room dal seed
      notes: 'Test ingresso automatizzato'
    };
    
    const { response: eventResp, data: eventData: eventRespData } = await fetchWithAuth(`${baseUrl}/api/production/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    
    console.log(`Status: ${eventResp.status}`);
    if (eventResp.ok) {
      console.log(`${colors.green}✓ Evento produzione registrato${colors.reset}`);
    }
  }

  // 4. TEST WORKFLOW
  console.log(`\n\n${colors.cyan}🔄 TEST WORKFLOW${colors.reset}`);
  
  console.log('\n➤ GET /api/workflow/pending');
  const { response: workflowResp, data: workflowData } = await fetchWithAuth(`${baseUrl}/api/workflow/pending`);
  console.log(`Status: ${workflowResp.status}`);
  console.log(`ODL in attesa: ${workflowData?.odls?.length || 0}`);

  // 5. TEST TIME METRICS
  console.log(`\n\n${colors.cyan}⏱️  TEST TIME METRICS${colors.reset}`);
  
  console.log('\n➤ GET /api/reports/time-metrics');
  const { response: metricsResp, data: metricsData } = await fetchWithAuth(`${baseUrl}/api/reports/time-metrics`);
  console.log(`Status: ${metricsResp.status}`);
  if (metricsData?.metrics) {
    console.log(`Metriche trovate: ${metricsData.metrics.length}`);
  }

  // 6. CLEANUP
  console.log(`\n\n${colors.cyan}🧹 CLEANUP${colors.reset}`);
  
  // DELETE parte creata
  if (createdPartId) {
    console.log(`\n➤ DELETE /api/parts/${createdPartId}`);
    const { response: deleteResp } = await fetchWithAuth(`${baseUrl}/api/parts/${createdPartId}`, {
      method: 'DELETE'
    });
    console.log(`Status: ${deleteResp.status}`);
    if (deleteResp.ok) {
      console.log(`${colors.green}✓ Parte eliminata${colors.reset}`);
    }
  }

  console.log(`\n${colors.bright}${colors.green}=== TEST COMPLETATI ===${colors.reset}\n`);
}

// Esegui i test
runTests().catch(error => {
  console.error(`${colors.red}Errore fatale:${colors.reset}`, error);
  process.exit(1);
});