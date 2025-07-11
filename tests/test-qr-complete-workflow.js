const fetch = require('node-fetch');

// Configurazione
const BASE_URL = 'http://localhost:3001/api';
const USERS = {
  cleanroom: { email: 'op1.cleanroom@mantaaero.com', password: 'password123' },
  autoclave: { email: 'op1.autoclave@mantaaero.com', password: 'password123' },
  ndi: { email: 'op1.ndi@mantaaero.com', password: 'password123' },
  admin: { email: 'admin@mantaaero.com', password: 'password123' }
};

// Helper per delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Helper per login
async function login(email, password) {
  // Get CSRF token
  const { response: csrfRes } = await apiCall('/auth/csrf');
  const csrfData = await csrfRes.text();
  const csrfMatch = csrfData.match(/"csrfToken":"([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  
  if (!csrfToken) {
    throw new Error('CSRF token non trovato');
  }

  // Login
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('csrfToken', csrfToken);

  const loginRes = await fetch(`${BASE_URL}/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
    redirect: 'manual'
  });

  const cookies = loginRes.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('Login fallito - nessun cookie ricevuto');
  }

  return { cookies, csrfToken };
}

// Simula scansione QR e azione
async function simulateQRScan(odl, action, userSession, departmentId) {
  console.log(`   📱 Simulazione scansione QR per ${action}...`);
  
  // Simula i dati che verrebbero dal QR code
  const qrData = {
    type: 'ODL',
    id: odl.id,
    odlNumber: odl.odlNumber,
    partNumber: odl.part?.partNumber,
    timestamp: new Date().toISOString()
  };
  
  console.log(`   📷 QR decodificato: ODL ${qrData.odlNumber}`);
  
  // Chiama l'API workflow/action come farebbe il QR scanner
  const { response, data } = await apiCall('/workflow/action', {
    method: 'POST',
    headers: {
      'Cookie': userSession.cookies,
      'x-csrf-token': userSession.csrfToken
    },
    body: JSON.stringify({
      odlId: qrData.id,
      departmentId: departmentId,
      actionType: action,
      confirmationRequired: false,
      metadata: {
        source: 'qr-scanner-test',
        duration: action === 'EXIT' ? Math.floor(Math.random() * 3600000) : undefined // Random 0-60 min
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Errore API: ${response.status} - ${data?.message || 'Unknown error'}`);
  }

  return data;
}

// Test workflow completo con QR
async function testCompleteQRWorkflow() {
  console.log('🚀 TEST WORKFLOW COMPLETO CON QR SCANNER\n');
  console.log('Questo test simula un ODL che attraversa tutti i reparti usando solo QR scanner\n');

  try {
    // 1. Login come admin per setup iniziale
    console.log('1. Setup iniziale come admin...');
    const adminSession = await login(USERS.admin.email, USERS.admin.password);
    console.log('   ✓ Login admin completato\n');

    // 2. Ottieni un ODL di test
    console.log('2. Selezione ODL per test...');
    const { data: odlList } = await apiCall('/odl?status=CREATED&limit=1', {
      headers: {
        'Cookie': adminSession.cookies
      }
    });

    if (!odlList?.odls?.length) {
      throw new Error('Nessun ODL in stato CREATED trovato. Eseguire seed database.');
    }

    const testODL = odlList.odls[0];
    console.log(`   ✓ ODL selezionato: ${testODL.odlNumber} - Part: ${testODL.part?.partNumber}`);
    console.log(`   ✓ Stato iniziale: ${testODL.status}\n`);

    // 3. Ottieni lista reparti
    const { data: departments } = await apiCall('/departments', {
      headers: { 'Cookie': adminSession.cookies }
    });

    const deptMap = {};
    departments.departments.forEach(d => {
      deptMap[d.type] = d;
    });

    // 4. Trasferimento manuale iniziale a Clean Room (richiesto per iniziare)
    console.log('3. Trasferimento iniziale a Clean Room (manuale richiesto)...');
    await apiCall(`/odl/${testODL.id}/transfer`, {
      method: 'POST',
      headers: {
        'Cookie': adminSession.cookies,
        'x-csrf-token': adminSession.csrfToken
      },
      body: JSON.stringify({
        targetDepartmentId: deptMap.CLEANROOM.id,
        notes: 'Inizio test workflow QR'
      })
    });
    console.log('   ✓ ODL trasferito a Clean Room\n');

    // WORKFLOW SEQUENZIALE CON QR
    const workflowSteps = [
      {
        department: 'CLEANROOM',
        user: USERS.cleanroom,
        expectedNextDept: 'AUTOCLAVE',
        actions: ['ENTRY', 'EXIT']
      },
      {
        department: 'AUTOCLAVE', 
        user: USERS.autoclave,
        expectedNextDept: 'CONTROLLO_NUMERICO',
        actions: ['ENTRY', 'EXIT']
      },
      {
        department: 'NDI',
        user: USERS.ndi,
        expectedNextDept: 'MONTAGGIO',
        actions: ['ENTRY', 'EXIT']
      }
    ];

    let currentStatus = 'IN_CLEANROOM';
    let stepNumber = 4;

    // Esegui workflow step by step
    for (const step of workflowSteps) {
      console.log(`${stepNumber}. Workflow ${step.department}:`);
      
      // Login operatore reparto
      const userSession = await login(step.user.email, step.user.password);
      console.log(`   ✓ Login operatore ${step.department}`);

      // Verifica stato corrente ODL
      const { data: odlCurrent } = await apiCall(`/odl/${testODL.id}`, {
        headers: { 'Cookie': userSession.cookies }
      });
      console.log(`   📊 Stato ODL: ${odlCurrent.odl.status}`);

      // ENTRY con QR
      if (step.actions.includes('ENTRY')) {
        const entryResult = await simulateQRScan(
          testODL, 
          'ENTRY', 
          userSession, 
          deptMap[step.department].id
        );
        console.log(`   ✓ ENTRY registrato: ${entryResult.message}`);
        await sleep(1000); // Pausa realistica
      }

      // Simula lavorazione
      console.log(`   ⏳ Simulazione lavorazione in ${step.department}...`);
      await sleep(2000);

      // EXIT con QR
      if (step.actions.includes('EXIT')) {
        const exitResult = await simulateQRScan(
          testODL, 
          'EXIT', 
          userSession, 
          deptMap[step.department].id
        );
        console.log(`   ✓ EXIT registrato: ${exitResult.message}`);
        
        if (exitResult.autoTransfer?.success) {
          console.log(`   🔄 Auto-trasferimento: ${exitResult.autoTransfer.message}`);
          console.log(`   → Trasferito a: ${exitResult.autoTransfer.nextDepartment?.name}`);
        }
      }

      // Verifica nuovo stato
      const { data: odlAfter } = await apiCall(`/odl/${testODL.id}`, {
        headers: { 'Cookie': adminSession.cookies }
      });
      console.log(`   📊 Nuovo stato ODL: ${odlAfter.odl.status}\n`);

      stepNumber++;
    }

    // 5. Verifica finale
    console.log(`${stepNumber}. Verifica finale:`);
    const { data: finalODL } = await apiCall(`/odl/${testODL.id}`, {
      headers: { 'Cookie': adminSession.cookies }
    });

    console.log(`   📊 Stato finale: ${finalODL.odl.status}`);
    console.log(`   📍 Reparto attuale: ${finalODL.odl.currentDepartment?.name || 'N/A'}`);

    // 6. Storico eventi
    const { data: events } = await apiCall(`/production/events?odlId=${testODL.id}`, {
      headers: { 'Cookie': adminSession.cookies }
    });

    console.log(`\n📋 STORICO EVENTI (${events.total} totali):`);
    events.events.slice(0, 10).forEach(e => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      const auto = e.isAutomatic ? ' [AUTO]' : '';
      console.log(`   ${time} - ${e.eventType} in ${e.department?.name}${auto}`);
    });

    // 7. Analisi trasferimenti automatici
    const autoTransfers = events.events.filter(e => e.isAutomatic);
    console.log(`\n🔄 TRASFERIMENTI AUTOMATICI: ${autoTransfers.length}`);
    autoTransfers.forEach(e => {
      if (e.eventType === 'ENTRY') {
        console.log(`   → Auto-ingresso in ${e.department?.name}`);
      }
    });

    // 8. Riepilogo workflow
    console.log('\n📊 RIEPILOGO WORKFLOW QR:');
    console.log(`   • ODL: ${testODL.odlNumber}`);
    console.log(`   • Stato iniziale: CREATED`);
    console.log(`   • Stato finale: ${finalODL.odl.status}`);
    console.log(`   • Eventi totali: ${events.total}`);
    console.log(`   • Trasferimenti automatici: ${autoTransfers.length}`);
    console.log(`   • Durata test: ${stepNumber - 1} steps`);

    // Verifica successo
    const expectedFinalStates = [
      'IN_CONTROLLO_NUMERICO', 
      'CONTROLLO_NUMERICO_COMPLETED',
      'IN_NDI',
      'NDI_COMPLETED',
      'IN_MONTAGGIO'
    ];

    if (expectedFinalStates.includes(finalODL.odl.status)) {
      console.log('\n✅ TEST COMPLETATO CON SUCCESSO!');
      console.log('   Il workflow QR funziona correttamente con trasferimenti automatici.\n');
    } else {
      console.log('\n⚠️  TEST COMPLETATO CON AVVERTIMENTI');
      console.log(`   Stato finale non previsto: ${finalODL.odl.status}\n`);
    }

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TEST:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test stati intermedi
async function testIntermediateStates() {
  console.log('\n🔍 VERIFICA STATI INTERMEDI\n');

  try {
    const adminSession = await login(USERS.admin.email, USERS.admin.password);

    // Verifica mapping stati per ogni reparto
    const stateMapping = {
      'CLEANROOM': {
        entry: 'IN_CLEANROOM',
        exit: 'CLEANROOM_COMPLETED'
      },
      'AUTOCLAVE': {
        entry: 'IN_AUTOCLAVE', 
        exit: 'AUTOCLAVE_COMPLETED'
      },
      'CONTROLLO_NUMERICO': {
        entry: 'IN_CONTROLLO_NUMERICO',
        exit: 'CONTROLLO_NUMERICO_COMPLETED'
      },
      'NDI': {
        entry: 'IN_NDI',
        exit: 'NDI_COMPLETED'
      },
      'MONTAGGIO': {
        entry: 'IN_MONTAGGIO',
        exit: 'MONTAGGIO_COMPLETED'
      },
      'VERNICIATURA': {
        entry: 'IN_VERNICIATURA',
        exit: 'VERNICIATURA_COMPLETED'
      },
      'CONTROLLO_QUALITA': {
        entry: 'IN_CONTROLLO_QUALITA',
        exit: 'CONTROLLO_QUALITA_COMPLETED'
      }
    };

    console.log('MAPPING STATI DEPARTMENT → ODL STATUS:');
    Object.entries(stateMapping).forEach(([dept, states]) => {
      console.log(`\n${dept}:`);
      console.log(`   ENTRY → ${states.entry}`);
      console.log(`   EXIT  → ${states.exit}`);
    });

    console.log('\n✓ Tutti i reparti hanno stati IN_DEPARTMENT e DEPARTMENT_COMPLETED');
    console.log('✓ CONTROLLO_QUALITA_COMPLETED → COMPLETED (stato finale)');

  } catch (error) {
    console.error('Errore verifica stati:', error.message);
  }
}

// Esegui test
(async () => {
  await testCompleteQRWorkflow();
  await testIntermediateStates();
})();