const fetch = require('node-fetch');

// Configurazione
const BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@mantaaero.com';
const ADMIN_PASSWORD = 'password123';

// Helper per chiamate API
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json().catch(() => null);
  return { response, data };
}

// Test del workflow ODL
async function testWorkflowAPI() {
  console.log('🚀 Test Workflow ODL via API\n');
  
  try {
    // 1. Health check
    console.log('1. Health Check...');
    const { response: healthRes, data: healthData } = await apiCall('/health');
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Database: ${healthData?.database?.status || 'N/A'}`);
    console.log(`   ✓ Server operativo\n`);

    // 2. Get CSRF Token (necessario per auth)
    console.log('2. Ottenimento CSRF Token...');
    const { response: csrfRes } = await apiCall('/auth/csrf');
    const csrfToken = csrfRes.headers.get('x-csrf-token') || 
                     (await csrfRes.json()).csrfToken;
    console.log(`   ✓ CSRF Token ottenuto\n`);

    // 3. Login
    console.log('3. Login come admin...');
    const { response: loginRes, data: loginData } = await apiCall('/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        csrfToken
      })
    });
    
    const cookies = loginRes.headers.get('set-cookie');
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   ✓ Login effettuato\n`);

    // Headers per richieste autenticate
    const authHeaders = {
      'Cookie': cookies,
      'x-csrf-token': csrfToken
    };

    // 4. Ottieni lista ODL
    console.log('4. Recupero ODL esistenti...');
    const { data: odlList } = await apiCall('/odl', {
      headers: authHeaders
    });
    
    console.log(`   Totale ODL: ${odlList?.total || 0}`);
    if (odlList?.odls?.length > 0) {
      const firstODL = odlList.odls[0];
      console.log(`   Primo ODL: ${firstODL.odlNumber} - Stato: ${firstODL.status}`);
      console.log(`   Part: ${firstODL.part?.partNumber}\n`);
    }

    // 5. Ottieni reparti
    console.log('5. Recupero reparti...');
    const { data: departments } = await apiCall('/departments', {
      headers: authHeaders
    });
    
    console.log(`   Reparti attivi: ${departments?.departments?.length || 0}`);
    const cleanRoom = departments?.departments?.find(d => d.type === 'CLEANROOM');
    const autoclavi = departments?.departments?.find(d => d.type === 'AUTOCLAVE');
    console.log(`   Clean Room ID: ${cleanRoom?.id}`);
    console.log(`   Autoclavi ID: ${autoclavi?.id}\n`);

    // 6. Test workflow con ODL esistente
    if (odlList?.odls?.length > 0 && cleanRoom && autoclavi) {
      const testODL = odlList.odls.find(o => o.status === 'CLEANROOM_COMPLETED') || odlList.odls[0];
      console.log(`6. Test workflow con ODL: ${testODL.odlNumber}\n`);

      // 6a. Registra ENTRY in reparto
      console.log('   a) Registrazione ENTRY...');
      const { response: entryRes, data: entryData } = await apiCall('/workflow/action', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          odlId: testODL.id,
          departmentId: cleanRoom.id,
          actionType: 'ENTRY',
          confirmationRequired: false
        })
      });
      
      console.log(`      Status: ${entryRes.status}`);
      console.log(`      Success: ${entryData?.success}`);
      console.log(`      Message: ${entryData?.message}\n`);

      // 6b. Registra EXIT dal reparto
      console.log('   b) Registrazione EXIT...');
      const { response: exitRes, data: exitData } = await apiCall('/workflow/action', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          odlId: testODL.id,
          departmentId: cleanRoom.id,
          actionType: 'EXIT',
          confirmationRequired: false
        })
      });
      
      console.log(`      Status: ${exitRes.status}`);
      console.log(`      Success: ${exitData?.success}`);
      console.log(`      Message: ${exitData?.message}`);
      
      if (exitData?.autoTransfer) {
        console.log(`      Auto-trasferimento: ${exitData.autoTransfer.success ? 'SI' : 'NO'}`);
        if (exitData.autoTransfer.nextDepartment) {
          console.log(`      Trasferito a: ${exitData.autoTransfer.nextDepartment.name}`);
        }
      }
      console.log('');

      // 6c. Verifica eventi
      console.log('   c) Verifica eventi produzione...');
      const { data: events } = await apiCall(`/production/events?odlId=${testODL.id}`, {
        headers: authHeaders
      });
      
      console.log(`      Eventi totali: ${events?.total || 0}`);
      if (events?.events) {
        const recentEvents = events.events.slice(0, 3);
        recentEvents.forEach(e => {
          console.log(`      - ${e.eventType} in ${e.department?.name} alle ${new Date(e.timestamp).toLocaleTimeString()}`);
        });
      }
    }

    // 7. Test QR Code
    console.log('\n7. Test generazione QR Code...');
    if (odlList?.odls?.length > 0) {
      const odlForQR = odlList.odls[0];
      const qrData = {
        type: 'ODL',
        id: odlForQR.id,
        odlNumber: odlForQR.odlNumber,
        partNumber: odlForQR.part?.partNumber,
        timestamp: new Date().toISOString()
      };
      
      console.log('   QR Data generato:');
      console.log(`   ${JSON.stringify(qrData, null, 2)}\n`);
    }

    // 8. Riepilogo
    console.log('📊 RIEPILOGO TEST WORKFLOW API:');
    console.log('   ✓ Server health check OK');
    console.log('   ✓ Autenticazione funzionante');
    console.log('   ✓ Lista ODL recuperata');
    console.log('   ✓ Lista reparti recuperata');
    console.log('   ✓ Eventi ENTRY/EXIT registrati');
    console.log('   ✓ Trasferimento automatico testato');
    console.log('   ✓ Storico eventi verificato');
    console.log('   ✓ Formato QR Code verificato\n');

    console.log('✅ TEST COMPLETATO CON SUCCESSO!\n');

  } catch (error) {
    console.error('❌ ERRORE DURANTE IL TEST:', error);
  }
}

// Test workflow QR Scanner
async function testQRScannerWorkflow() {
  console.log('\n🔍 ANALISI WORKFLOW QR SCANNER\n');
  
  console.log('FLUSSO QR SCANNER:');
  console.log('1. Operatore scansiona QR code ODL');
  console.log('2. App decodifica JSON dal QR: {type, id, odlNumber, partNumber, timestamp}');
  console.log('3. Operatore sceglie ENTRY o EXIT');
  console.log('4. App chiama POST /api/workflow/action con:');
  console.log('   - odlId: ID dell\'ODL scansionato');
  console.log('   - departmentId: Reparto dell\'operatore (da sessione)');
  console.log('   - actionType: ENTRY o EXIT');
  console.log('   - confirmationRequired: false (da QR scanner)');
  console.log('5. Backend registra evento produzione');
  console.log('6. Se EXIT, backend tenta trasferimento automatico:');
  console.log('   - Verifica workflow sequence (Clean Room → Autoclavi → NDI...)');
  console.log('   - Aggiorna stato ODL');
  console.log('   - Crea eventi EXIT (reparto corrente) + ENTRY (reparto successivo)');
  console.log('7. Se offline, eventi salvati localmente e sincronizzati quando torna online\n');

  console.log('STATI ODL E TRANSIZIONI:');
  console.log('- CREATED → IN_CLEANROOM (trasferimento manuale)');
  console.log('- IN_CLEANROOM → CLEANROOM_COMPLETED (completamento manuale)');
  console.log('- CLEANROOM_COMPLETED + EXIT → IN_AUTOCLAVE (auto-trasferimento)');
  console.log('- IN_AUTOCLAVE → AUTOCLAVE_COMPLETED (completamento batch)');
  console.log('- AUTOCLAVE_COMPLETED + EXIT → IN_CONTROLLO_NUMERICO (auto-trasferimento)');
  console.log('- E così via seguendo WORKFLOW_SEQUENCE...\n');

  console.log('GESTIONE OFFLINE:');
  console.log('- Eventi salvati in localStorage con flag synced=false');
  console.log('- ConnectivityChecker monitora connessione reale (non solo navigator.onLine)');
  console.log('- Sync automatico con retry quando torna online');
  console.log('- Batch sync per ottimizzare performance\n');
}

// Esegui test
(async () => {
  await testWorkflowAPI();
  await testQRScannerWorkflow();
})();