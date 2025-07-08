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

function logRequest(method, url, body = null) {
  log(`\n📤 ${method} ${url}`, 'cyan');
  if (body) {
    log('   Body:', 'cyan');
    console.log('   ' + JSON.stringify(body, null, 2).split('\n').join('\n   '));
  }
}

function logResponse(status, data) {
  const color = status >= 200 && status < 300 ? 'green' : 'red';
  log(`📥 Status: ${status}`, color);
  log('   Response:', color);
  console.log('   ' + JSON.stringify(data, null, 2).split('\n').join('\n   '));
}

// Variabili globali per test
let authCookie = null;
let createdPartId = null;
const testPartNumber = `TEST${Date.now()}`;

// Login per ottenere cookie di sessione
async function login() {
  logSection('AUTENTICAZIONE');
  
  try {
    // Step 1: Get CSRF token
    logInfo('Recupero CSRF token...');
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    
    if (!csrfToken) {
      logError('Impossibile ottenere CSRF token');
      return false;
    }
    
    logSuccess(`CSRF token ottenuto: ${csrfToken.substring(0, 20)}...`);
    
    // Step 2: Login with credentials
    logRequest('POST', `${BASE_URL}/api/auth/callback/credentials`);
    
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfResponse.headers.get('set-cookie')?.split(';')[0] || '',
      },
      body: new URLSearchParams({
        email: 'admin@mantaaero.com',
        password: 'password123',
        csrfToken: csrfToken,
        redirect: 'false',
        callbackUrl: '/',
        json: 'true',
      }),
      redirect: 'manual',
    });

    // Get all cookies from response
    const cookies = [];
    const setCookieHeaders = response.headers.raw ? response.headers.raw()['set-cookie'] : [response.headers.get('set-cookie')];
    
    if (setCookieHeaders && setCookieHeaders[0]) {
      setCookieHeaders.forEach(cookie => {
        if (cookie) {
          const sessionCookie = cookie.split(';')[0];
          if (sessionCookie.includes('authjs.session-token') || sessionCookie.includes('next-auth.session-token')) {
            cookies.push(sessionCookie);
          }
        }
      });
    }

    if (cookies.length > 0) {
      authCookie = cookies.join('; ');
      logSuccess(`Login completato - Cookie sessione ottenuto`);
      return true;
    } else {
      // Prova metodo alternativo - login diretto tramite test endpoint
      logInfo('Tentativo login con metodo alternativo...');
      
      const altResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@mantaaero.com',
          password: 'password123',
        }),
      });
      
      if (altResponse.ok) {
        const altCookie = altResponse.headers.get('set-cookie');
        if (altCookie) {
          authCookie = altCookie.split(';')[0];
          logSuccess('Login completato con metodo alternativo');
          return true;
        }
      }
      
      logError('Login fallito - nessun cookie di sessione ricevuto');
      return false;
    }
  } catch (error) {
    logError(`Errore login: ${error.message}`);
    return false;
  }
}

// Helper per fare richieste autenticate
async function fetchAuthenticated(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cookie': authCookie,
      'Content-Type': 'application/json',
    },
  });
}

// Test GET /api/parts (lista parti)
async function testGetParts() {
  logSection('TEST GET /api/parts (Lista Parti)');
  
  try {
    // Test 1: Lista base
    logInfo('Test 1: Lista parti senza parametri');
    logRequest('GET', `${BASE_URL}/api/parts`);
    
    let response = await fetchAuthenticated(`${BASE_URL}/api/parts`);
    let data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.ok && data.data && Array.isArray(data.data)) {
      logSuccess(`Recuperate ${data.data.length} parti (pagina ${data.meta.page} di ${data.meta.totalPages})`);
    } else {
      logError('Formato risposta non valido');
    }

    // Test 2: Con parametri di ricerca
    logInfo('\nTest 2: Ricerca con parametri');
    const searchUrl = `${BASE_URL}/api/parts?search=8G&limit=5&sortBy=createdAt&sortOrder=desc`;
    logRequest('GET', searchUrl);
    
    response = await fetchAuthenticated(searchUrl);
    data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.ok) {
      logSuccess('Ricerca con parametri completata');
    }

    // Test 3: Filtro isActive
    logInfo('\nTest 3: Filtro parti attive');
    const activeUrl = `${BASE_URL}/api/parts?isActive=true`;
    logRequest('GET', activeUrl);
    
    response = await fetchAuthenticated(activeUrl);
    data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.ok) {
      logSuccess('Filtro parti attive completato');
    }

  } catch (error) {
    logError(`Errore nel test GET /api/parts: ${error.message}`);
  }
}

// Test POST /api/parts (crea parte)
async function testCreatePart() {
  logSection('TEST POST /api/parts (Crea Parte)');
  
  try {
    // Test 1: Creazione parte valida
    logInfo('Test 1: Creazione parte valida');
    const newPart = {
      partNumber: testPartNumber,
      description: 'Parte di test creata da script Node.js'
    };
    
    logRequest('POST', `${BASE_URL}/api/parts`, newPart);
    
    let response = await fetchAuthenticated(`${BASE_URL}/api/parts`, {
      method: 'POST',
      body: JSON.stringify(newPart),
    });
    
    let data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 201 && data.id) {
      createdPartId = data.id;
      logSuccess(`Parte creata con ID: ${createdPartId}`);
    } else {
      logError('Creazione parte fallita');
    }

    // Test 2: Tentativo di creare parte duplicata
    logInfo('\nTest 2: Tentativo creazione parte duplicata (deve fallire)');
    logRequest('POST', `${BASE_URL}/api/parts`, newPart);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts`, {
      method: 'POST',
      body: JSON.stringify(newPart),
    });
    
    data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 409) {
      logSuccess('Duplicato correttamente rifiutato');
    } else {
      logError('Il duplicato dovrebbe essere rifiutato con status 409');
    }

    // Test 3: Validazione campi mancanti
    logInfo('\nTest 3: Validazione campi mancanti');
    const invalidPart = { partNumber: 'INVALID' }; // Manca description
    
    logRequest('POST', `${BASE_URL}/api/parts`, invalidPart);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts`, {
      method: 'POST',
      body: JSON.stringify(invalidPart),
    });
    
    data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 400) {
      logSuccess('Validazione corretta per campi mancanti');
    } else {
      logError('La validazione dovrebbe fallire con status 400');
    }

  } catch (error) {
    logError(`Errore nel test POST /api/parts: ${error.message}`);
  }
}

// Test GET /api/parts/[id] (dettaglio parte)
async function testGetPartById() {
  logSection('TEST GET /api/parts/[id] (Dettaglio Parte)');
  
  if (!createdPartId) {
    logError('Nessuna parte creata per il test, salto questo test');
    return;
  }

  try {
    // Test 1: Recupero parte esistente
    logInfo('Test 1: Recupero parte esistente');
    logRequest('GET', `${BASE_URL}/api/parts/${createdPartId}`);
    
    let response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`);
    let data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.ok && data.id === createdPartId) {
      logSuccess('Parte recuperata correttamente');
    } else {
      logError('Recupero parte fallito');
    }

    // Test 2: Parte non esistente
    logInfo('\nTest 2: Tentativo recupero parte non esistente');
    const fakeId = 'clxxxxxxxxxxxxxxxxxx';
    logRequest('GET', `${BASE_URL}/api/parts/${fakeId}`);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts/${fakeId}`);
    data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.status === 404) {
      logSuccess('404 correttamente restituito per parte non esistente');
    } else {
      logError('Dovrebbe restituire 404 per parte non esistente');
    }

  } catch (error) {
    logError(`Errore nel test GET /api/parts/[id]: ${error.message}`);
  }
}

// Test PUT /api/parts/[id] (modifica parte)
async function testUpdatePart() {
  logSection('TEST PUT /api/parts/[id] (Modifica Parte)');
  
  if (!createdPartId) {
    logError('Nessuna parte creata per il test, salto questo test');
    return;
  }

  try {
    // Test 1: Modifica valida
    logInfo('Test 1: Modifica descrizione parte');
    const updateData = {
      description: 'Descrizione modificata dal test'
    };
    
    logRequest('PUT', `${BASE_URL}/api/parts/${createdPartId}`, updateData);
    
    let response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    let data = await response.json();
    logResponse(response.status, data);
    
    if (response.ok && data.description === updateData.description) {
      logSuccess('Parte modificata correttamente');
    } else {
      logError('Modifica parte fallita');
    }

    // Test 2: Modifica parte non esistente
    logInfo('\nTest 2: Tentativo modifica parte non esistente');
    const fakeId = 'clxxxxxxxxxxxxxxxxxx';
    
    logRequest('PUT', `${BASE_URL}/api/parts/${fakeId}`, updateData);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts/${fakeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 404) {
      logSuccess('404 correttamente restituito per modifica parte non esistente');
    } else {
      logError('Dovrebbe restituire 404 per parte non esistente');
    }

    // Test 3: Validazione dati non validi
    logInfo('\nTest 3: Validazione partNumber non valido');
    const invalidUpdate = {
      partNumber: 'TEST-INVALID!' // Caratteri non permessi
    };
    
    logRequest('PUT', `${BASE_URL}/api/parts/${createdPartId}`, invalidUpdate);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`, {
      method: 'PUT',
      body: JSON.stringify(invalidUpdate),
    });
    
    data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 400) {
      logSuccess('Validazione corretta per formato partNumber non valido');
    } else {
      logError('La validazione dovrebbe fallire con status 400');
    }

  } catch (error) {
    logError(`Errore nel test PUT /api/parts/[id]: ${error.message}`);
  }
}

// Test DELETE /api/parts/[id] (elimina parte)
async function testDeletePart() {
  logSection('TEST DELETE /api/parts/[id] (Elimina Parte)');
  
  if (!createdPartId) {
    logError('Nessuna parte creata per il test, salto questo test');
    return;
  }

  try {
    // Test 1: Eliminazione parte esistente
    logInfo('Test 1: Eliminazione parte di test');
    logRequest('DELETE', `${BASE_URL}/api/parts/${createdPartId}`);
    
    let response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`, {
      method: 'DELETE',
    });
    
    let data = await response.json();
    logResponse(response.status, data);
    
    if (response.ok && data.success) {
      logSuccess('Parte eliminata correttamente');
    } else {
      logError('Eliminazione parte fallita');
    }

    // Test 2: Tentativo eliminazione parte già eliminata
    logInfo('\nTest 2: Tentativo eliminazione parte già eliminata');
    logRequest('DELETE', `${BASE_URL}/api/parts/${createdPartId}`);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`, {
      method: 'DELETE',
    });
    
    data = await response.json();
    logResponse(response.status, data);
    
    if (response.status === 404) {
      logSuccess('404 correttamente restituito per parte già eliminata');
    } else {
      logError('Dovrebbe restituire 404 per parte non esistente');
    }

    // Test 3: Verifica che la parte sia stata effettivamente eliminata
    logInfo('\nTest 3: Verifica eliminazione effettiva');
    logRequest('GET', `${BASE_URL}/api/parts/${createdPartId}`);
    
    response = await fetchAuthenticated(`${BASE_URL}/api/parts/${createdPartId}`);
    data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.status === 404) {
      logSuccess('Parte correttamente non trovata dopo eliminazione');
    } else {
      logError('La parte dovrebbe essere non trovata dopo eliminazione');
    }

  } catch (error) {
    logError(`Errore nel test DELETE /api/parts/[id]: ${error.message}`);
  }
}

// Test senza autenticazione
async function testUnauthorized() {
  logSection('TEST ACCESSO NON AUTORIZZATO');
  
  try {
    logInfo('Test accesso senza autenticazione');
    logRequest('GET', `${BASE_URL}/api/parts`);
    
    const response = await fetch(`${BASE_URL}/api/parts`);
    const data = await response.json();
    
    logResponse(response.status, data);
    
    if (response.status === 401) {
      logSuccess('401 correttamente restituito per accesso non autorizzato');
    } else {
      logError('Dovrebbe restituire 401 per accesso non autorizzato');
    }
  } catch (error) {
    logError(`Errore nel test non autorizzato: ${error.message}`);
  }
}

// Test permessi (solo admin/supervisor possono creare)
async function testPermissions() {
  logSection('TEST PERMESSI RUOLI');
  
  // Questo test richiederebbe di fare login con utenti diversi
  // Per ora lo saltiamo ma lo documentiamo
  logInfo('Test permessi richiede login con diversi ruoli utente');
  logInfo('- ADMIN: può fare tutto (CREATE, UPDATE, DELETE)');
  logInfo('- SUPERVISOR: può CREATE e UPDATE');
  logInfo('- CAPO_REPARTO: può solo UPDATE');
  logInfo('- OPERATOR: può solo READ');
}

// Funzione principale
async function runTests() {
  log('\n🚀 INIZIO TEST SUITE API PARTS', 'bright');
  log(`📍 Server: ${BASE_URL}`, 'cyan');
  log(`🕐 Data/Ora: ${new Date().toLocaleString('it-IT')}`, 'cyan');
  
  // Controlla se il server è attivo
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/auth/providers`);
    if (!healthCheck.ok) {
      throw new Error('Server non raggiungibile');
    }
  } catch (error) {
    logError(`Server non raggiungibile su ${BASE_URL}`);
    logError('Assicurati che il server sia attivo con: npm run dev');
    process.exit(1);
  }

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Login fallito, impossibile continuare i test');
    process.exit(1);
  }

  // Esegui tutti i test
  await testGetParts();
  await testCreatePart();
  await testGetPartById();
  await testUpdatePart();
  await testDeletePart();
  await testUnauthorized();
  await testPermissions();

  // Riepilogo
  logSection('RIEPILOGO TEST COMPLETATI');
  logSuccess('Tutti i test delle API Parts sono stati eseguiti');
  logInfo('Controlla i log sopra per i dettagli di ogni test');
  log('\n✨ TEST SUITE COMPLETATA', 'bright');
}

// Esegui i test
runTests().catch(error => {
  logError(`Errore fatale: ${error.message}`);
  console.error(error);
  process.exit(1);
});