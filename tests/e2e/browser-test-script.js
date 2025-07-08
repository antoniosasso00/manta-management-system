/**
 * Script di test da eseguire nella console del browser
 * 
 * ISTRUZIONI:
 * 1. Apri http://localhost:3000 in Chrome
 * 2. Fai login con admin@mantaaero.com / password123
 * 3. Apri la console (F12)
 * 4. Copia e incolla tutto questo script
 * 5. Premi Enter per eseguire
 */

(async function runBrowserTests() {
  console.log('%c=== TEST MES AEROSPAZIO ===', 'color: blue; font-size: 20px; font-weight: bold');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Helper per logging colorato
  const log = {
    success: (msg) => console.log(`%c✓ ${msg}`, 'color: green'),
    error: (msg) => console.log(`%c✗ ${msg}`, 'color: red'),
    info: (msg) => console.log(`%c➤ ${msg}`, 'color: blue'),
    warn: (msg) => console.log(`%c⚠ ${msg}`, 'color: orange')
  };

  // Helper per fetch
  async function testFetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      const data = await response.json();
      return { response, data, error: null };
    } catch (error) {
      return { response: null, data: null, error };
    }
  }

  // Test 1: Parts API
  console.group('%c📦 TEST PARTS API', 'color: cyan; font-size: 16px');
  
  // GET Parts
  log.info('GET /api/parts');
  const partsResult = await testFetch('/api/parts');
  if (partsResult.response?.ok) {
    log.success(`Trovate ${partsResult.data.parts.length} parti`);
    results.passed++;
    console.table(partsResult.data.parts.slice(0, 3).map(p => ({
      PartNumber: p.partNumber,
      Description: p.description,
      Material: p.material
    })));
  } else {
    log.error('Errore nel recupero parti');
    results.failed++;
  }

  // POST Part
  log.info('POST /api/parts - Creazione nuova parte');
  const newPart = {
    partNumber: `TEST-${Date.now()}`,
    description: 'Test Part da Browser',
    material: 'CFRP',
    category: 'STRUCTURAL',
    aerospaceStandard: 'AS9100',
    isActive: true
  };
  
  const createResult = await testFetch('/api/parts', {
    method: 'POST',
    body: JSON.stringify(newPart)
  });
  
  let createdPartId = null;
  if (createResult.response?.ok) {
    createdPartId = createResult.data.part.id;
    log.success(`Parte creata: ${createResult.data.part.partNumber} (ID: ${createdPartId})`);
    results.passed++;
  } else {
    log.error(`Creazione fallita: ${createResult.data?.error || 'Errore sconosciuto'}`);
    results.failed++;
  }

  console.groupEnd();

  // Test 2: ODL API
  console.group('%c📋 TEST ODL API', 'color: cyan; font-size: 16px');
  
  // GET ODL
  log.info('GET /api/odl');
  const odlResult = await testFetch('/api/odl');
  if (odlResult.response?.ok) {
    log.success(`Trovati ${odlResult.data.odls.length} ODL`);
    results.passed++;
    
    // Mostra distribuzione per stato
    const statusCount = odlResult.data.odls.reduce((acc, odl) => {
      acc[odl.status] = (acc[odl.status] || 0) + 1;
      return acc;
    }, {});
    console.table(statusCount);
  } else {
    log.error('Errore nel recupero ODL');
    results.failed++;
  }

  // POST ODL
  if (partsResult.data?.parts?.[0]) {
    log.info('POST /api/odl - Creazione nuovo ODL');
    const newOdl = {
      partId: partsResult.data.parts[0].id,
      quantity: 3,
      priority: 'HIGH',
      gammaId: `GM-TEST-${Date.now()}`
    };
    
    const createOdlResult = await testFetch('/api/odl', {
      method: 'POST',
      body: JSON.stringify(newOdl)
    });
    
    if (createOdlResult.response?.ok) {
      log.success(`ODL creato: ${createOdlResult.data.odl.odlNumber}`);
      results.passed++;
    } else {
      log.error(`Creazione ODL fallita: ${createOdlResult.data?.error || 'Errore'}`);
      results.failed++;
    }
  }

  console.groupEnd();

  // Test 3: Production Events
  console.group('%c🏭 TEST PRODUCTION EVENTS', 'color: cyan; font-size: 16px');
  
  log.info('GET /api/production/events/recent');
  const eventsResult = await testFetch('/api/production/events/recent');
  if (eventsResult.response?.ok) {
    log.success(`Trovati ${eventsResult.data.events.length} eventi recenti`);
    results.passed++;
    
    // Mostra ultimi 3 eventi
    const recentEvents = eventsResult.data.events.slice(0, 3).map(e => ({
      ODL: e.odl.odlNumber,
      Tipo: e.eventType,
      Reparto: e.department.name,
      Ora: new Date(e.timestamp).toLocaleString('it-IT')
    }));
    console.table(recentEvents);
  } else {
    log.error('Errore nel recupero eventi');
    results.failed++;
  }

  console.groupEnd();

  // Test 4: Departments
  console.group('%c🏢 TEST DEPARTMENTS', 'color: cyan; font-size: 16px');
  
  log.info('GET /api/departments');
  const deptsResult = await testFetch('/api/departments');
  if (deptsResult.response?.ok) {
    log.success(`Trovati ${deptsResult.data.departments.length} reparti`);
    results.passed++;
    console.table(deptsResult.data.departments.map(d => ({
      Nome: d.name,
      Codice: d.code,
      Tipo: d.type,
      Attivo: d.isActive ? '✓' : '✗'
    })));
  } else {
    log.error('Errore nel recupero reparti');
    results.failed++;
  }

  console.groupEnd();

  // Test 5: Workflow
  console.group('%c🔄 TEST WORKFLOW', 'color: cyan; font-size: 16px');
  
  log.info('GET /api/workflow/pending');
  const workflowResult = await testFetch('/api/workflow/pending');
  if (workflowResult.response?.ok) {
    log.success(`${workflowResult.data.odls.length} ODL in attesa di trasferimento`);
    results.passed++;
    if (workflowResult.data.odls.length > 0) {
      console.table(workflowResult.data.odls.map(o => ({
        ODL: o.odlNumber,
        Parte: o.part.partNumber,
        Stato: o.status,
        Prossimo: o.suggestedNextDepartment || 'N/A'
      })));
    }
  } else {
    log.error('Errore nel recupero workflow');
    results.failed++;
  }

  console.groupEnd();

  // Test 6: Time Metrics
  console.group('%c⏱️ TEST TIME METRICS', 'color: cyan; font-size: 16px');
  
  log.info('POST /api/time-tracking/start');
  const startTimeResult = await testFetch('/api/time-tracking/start', {
    method: 'POST',
    body: JSON.stringify({
      odlId: odlResult.data?.odls?.[0]?.id,
      departmentId: deptsResult.data?.departments?.[0]?.id,
      operationType: 'LAMINATION'
    })
  });
  
  if (startTimeResult.response?.ok) {
    log.success('Timer avviato con successo');
    results.passed++;
    
    // Stop immediato per test
    setTimeout(async () => {
      const stopResult = await testFetch('/api/time-tracking/stop', {
        method: 'POST',
        body: JSON.stringify({
          trackingId: startTimeResult.data.tracking.id
        })
      });
      
      if (stopResult.response?.ok) {
        log.success(`Timer fermato. Durata: ${stopResult.data.tracking.duration} secondi`);
      }
    }, 2000);
  } else {
    log.error('Errore avvio timer');
    results.failed++;
  }

  console.groupEnd();

  // Cleanup
  if (createdPartId) {
    console.group('%c🧹 CLEANUP', 'color: yellow; font-size: 16px');
    log.info(`DELETE /api/parts/${createdPartId}`);
    const deleteResult = await testFetch(`/api/parts/${createdPartId}`, {
      method: 'DELETE'
    });
    if (deleteResult.response?.ok) {
      log.success('Parte di test eliminata');
    }
    console.groupEnd();
  }

  // Risultati finali
  console.log('\n');
  console.log('%c=== RISULTATI TEST ===', 'color: purple; font-size: 18px; font-weight: bold');
  console.log(`%c✓ Passati: ${results.passed}`, 'color: green; font-size: 16px');
  console.log(`%c✗ Falliti: ${results.failed}`, 'color: red; font-size: 16px');
  console.log(`%cTotale: ${results.passed + results.failed}`, 'font-size: 16px');
  
  if (results.failed === 0) {
    console.log('%c🎉 TUTTI I TEST SONO PASSATI! 🎉', 'color: green; font-size: 20px; font-weight: bold');
  } else {
    console.log('%c⚠️  Alcuni test sono falliti', 'color: orange; font-size: 16px');
  }
  
  return results;
})();