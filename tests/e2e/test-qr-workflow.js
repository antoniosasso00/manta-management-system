/**
 * Test del flusso QR code e avanzamenti produzione
 * Da eseguire nella console del browser dopo login
 */

(async function testQRWorkflow() {
  console.log('%c=== TEST QR CODE & WORKFLOW ===', 'color: indigo; font-size: 20px; font-weight: bold');
  
  const log = {
    success: (msg) => console.log(`%c✓ ${msg}`, 'color: green'),
    error: (msg) => console.log(`%c✗ ${msg}`, 'color: red'),
    info: (msg) => console.log(`%c➤ ${msg}`, 'color: blue'),
    warn: (msg) => console.log(`%c⚠ ${msg}`, 'color: orange')
  };

  // Helper per simulare scan QR
  async function simulateQRScan(qrData) {
    const response = await fetch('/api/qr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: qrData })
    });
    return response.json();
  }

  // 1. TEST QR GENERATION
  console.group('%c🔲 TEST GENERAZIONE QR', 'color: blue; font-size: 16px');
  
  // Prendi un ODL esistente
  const odlsResp = await fetch('/api/odl?status=IN_CLEANROOM&limit=1');
  const odlsData = await odlsResp.json();
  
  if (odlsData.odls?.length > 0) {
    const odl = odlsData.odls[0];
    log.success(`ODL selezionato: ${odl.odlNumber}`);
    
    // Genera QR code
    log.info('Generazione QR code');
    const qrResp = await fetch(`/api/qr/generate/${odl.id}`);
    const qrData = await qrResp.json();
    
    if (qrData.qrCode) {
      log.success('QR code generato');
      console.log('QR Data:', qrData.qrData);
      
      // Mostra QR come immagine se SVG
      if (qrData.qrCode.startsWith('<svg')) {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(qrData.qrCode);
        img.style.width = '200px';
        console.log('%cQR Code:', 'font-weight: bold');
        console.log(img);
      }
    }
  } else {
    log.warn('Nessun ODL in Clean Room trovato');
  }
  
  console.groupEnd();

  // 2. TEST WORKFLOW COMPLETO
  console.group('%c🔄 TEST WORKFLOW COMPLETO', 'color: purple; font-size: 16px');
  
  // Crea nuovo ODL per test workflow
  log.info('Creazione ODL di test per workflow');
  
  // Prima ottieni una parte
  const partsResp = await fetch('/api/parts?limit=1');
  const partsData = await partsResp.json();
  
  if (partsData.parts?.length > 0) {
    const testOdl = {
      partId: partsData.parts[0].id,
      quantity: 2,
      priority: 'HIGH',
      gammaId: `GM-WORKFLOW-${Date.now()}`
    };
    
    const createOdlResp = await fetch('/api/odl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOdl)
    });
    
    if (createOdlResp.ok) {
      const createdOdl = await createOdlResp.json();
      const odlId = createdOdl.odl.id;
      log.success(`ODL creato: ${createdOdl.odl.odlNumber}`);
      
      // Ottieni reparti
      const deptsResp = await fetch('/api/departments');
      const deptsData = await deptsResp.json();
      const cleanRoom = deptsData.departments.find(d => d.code === 'CLEAN');
      const autoclave = deptsData.departments.find(d => d.code === 'AUTO');
      const ndi = deptsData.departments.find(d => d.code === 'NDI');
      
      // Ottieni operatori
      const usersResp = await fetch('/api/users?departmentId=' + cleanRoom.id);
      const usersData = await usersResp.json();
      const operator = usersData.users?.[0];
      
      if (cleanRoom && operator) {
        // Step 1: Ingresso Clean Room
        log.info('1️⃣ Ingresso Clean Room');
        const entry1 = await fetch('/api/production/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            odlId: odlId,
            departmentId: cleanRoom.id,
            eventType: 'ENTRY',
            operatorId: operator.id,
            notes: 'Test workflow - ingresso clean room'
          })
        });
        
        if (entry1.ok) {
          log.success('ODL entrato in Clean Room');
          
          // Simula lavoro
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Step 2: Uscita Clean Room
          log.info('2️⃣ Uscita Clean Room');
          const exit1 = await fetch('/api/production/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              odlId: odlId,
              departmentId: cleanRoom.id,
              eventType: 'EXIT',
              operatorId: operator.id,
              notes: 'Laminazione completata'
            })
          });
          
          if (exit1.ok) {
            log.success('ODL uscito da Clean Room');
            
            // Verifica workflow pending
            log.info('Verifica ODL in attesa workflow');
            const pendingResp = await fetch('/api/workflow/pending');
            const pendingData = await pendingResp.json();
            
            const isPending = pendingData.odls.some(o => o.id === odlId);
            if (isPending) {
              log.success('ODL in attesa di trasferimento automatico');
            }
            
            // Step 3: Trasferimento automatico
            if (autoclave) {
              log.info('3️⃣ Trasferimento automatico ad Autoclavi');
              const transferResp = await fetch('/api/workflow/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  odlId: odlId,
                  targetDepartmentId: autoclave.id
                })
              });
              
              if (transferResp.ok) {
                log.success('ODL trasferito automaticamente ad Autoclavi');
              }
            }
          }
        }
      }
      
      // Mostra timeline eventi
      log.info('📊 Timeline eventi ODL');
      const eventsResp = await fetch(`/api/production/events?odlId=${odlId}`);
      const eventsData = await eventsResp.json();
      
      if (eventsData.events?.length > 0) {
        console.table(eventsData.events.map(e => ({
          Tipo: e.eventType,
          Reparto: e.department.name,
          Operatore: e.operator.name,
          Ora: new Date(e.timestamp).toLocaleString('it-IT'),
          Note: e.notes || '-'
        })));
      }
    }
  }
  
  console.groupEnd();

  // 3. TEST SCAN QR OFFLINE
  console.group('%c📱 TEST SCAN QR OFFLINE', 'color: teal; font-size: 16px');
  
  log.info('Simulazione scan QR offline');
  
  // Simula dati QR
  const mockQRData = {
    odlNumber: 'ODL-24-001',
    partNumber: '8G5350A0',
    priority: 'HIGH'
  };
  
  // Test parsing QR
  const parseResp = await fetch('/api/qr/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: JSON.stringify(mockQRData) })
  });
  
  if (parseResp.ok) {
    const parsed = await parseResp.json();
    log.success('QR parsing riuscito');
    console.table(parsed.data);
  }
  
  // Simula sync queue offline
  log.info('Test coda sync offline');
  const syncQueue = [
    {
      odlId: 'test-123',
      action: 'ENTRY',
      departmentId: 'dept-456',
      timestamp: new Date().toISOString(),
      synced: false
    }
  ];
  
  console.log('Coda sync simulata:', syncQueue);
  log.warn('In produzione, questa coda viene salvata in localStorage e sincronizzata quando torna online');
  
  console.groupEnd();

  // 4. TEST BATCH OPTIMIZATION
  console.group('%c📦 TEST OTTIMIZZAZIONE BATCH', 'color: brown; font-size: 16px');
  
  log.info('Recupero ODL pronti per autoclave');
  const readyResp = await fetch('/api/odl?status=CLEANROOM_COMPLETED');
  const readyData = await readyResp.json();
  
  if (readyData.odls?.length >= 3) {
    log.success(`${readyData.odls.length} ODL pronti per ottimizzazione`);
    
    // Prepara richiesta ottimizzazione
    const optimizationRequest = {
      odlIds: readyData.odls.slice(0, 5).map(o => o.id),
      autoclaveId: 'clngw4dik002kiko0v3emyqev' // ID autoclave dal seed
    };
    
    log.info('Richiesta ottimizzazione batch');
    const optResp = await fetch('/api/autoclave/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimizationRequest)
    });
    
    if (optResp.ok) {
      const optData = await optResp.json();
      log.success('Ottimizzazione completata');
      console.log('Risultati ottimizzazione:', optData);
      
      if (optData.batches?.length > 0) {
        console.table(optData.batches.map(b => ({
          'Batch': b.batchNumber,
          'ODL': b.odls.length,
          'Utilizzo (%)': Math.round(b.utilization * 100),
          'Ciclo': b.curingCycle
        })));
      }
    }
  } else {
    log.warn('Servono almeno 3 ODL pronti per testare l\'ottimizzazione');
  }
  
  console.groupEnd();

  // 5. TEST TRACKING REAL-TIME
  console.group('%c⏱️ TEST TRACKING TEMPO REALE', 'color: darkgreen; font-size: 16px');
  
  log.info('Avvio tracking tempo operazione');
  
  if (odlsData.odls?.[0] && deptsData?.departments?.[0]) {
    const trackingStart = {
      odlId: odlsData.odls[0].id,
      departmentId: deptsData.departments[0].id,
      operationType: 'LAMINATION'
    };
    
    const startResp = await fetch('/api/time-tracking/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingStart)
    });
    
    if (startResp.ok) {
      const startData = await startResp.json();
      const trackingId = startData.tracking.id;
      log.success(`Tracking avviato (ID: ${trackingId})`);
      
      // Simula lavoro per 3 secondi
      log.info('Simulazione lavoro in corso...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Stop tracking
      const stopResp = await fetch('/api/time-tracking/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingId })
      });
      
      if (stopResp.ok) {
        const stopData = await stopResp.json();
        log.success(`Tracking completato. Durata: ${stopData.tracking.duration} secondi`);
        
        // Crea metrica
        const metricResp = await fetch('/api/time-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            odlId: odlsData.odls[0].id,
            departmentId: deptsData.departments[0].id,
            operationType: 'LAMINATION',
            plannedDuration: 120,
            actualDuration: stopData.tracking.duration,
            operatorId: operator?.id
          })
        });
        
        if (metricResp.ok) {
          log.success('Metrica tempo salvata');
        }
      }
    }
  }
  
  console.groupEnd();

  console.log('\n%c=== TEST QR & WORKFLOW COMPLETATO ===', 'color: indigo; font-size: 18px; font-weight: bold');
})();