#!/usr/bin/env node

/**
 * Generatore di comandi curl per testare le API Parts
 * 
 * Questo script genera i comandi curl pronti per essere copiati e incollati
 * dopo aver fatto login nel browser.
 */

const BASE_URL = 'http://localhost:3000';
const TEST_PART_NUMBER = `TEST${Date.now()}`;

// Colori
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateTests() {
  log('\n🧪 GENERATORE TEST API PARTS', 'bright');
  log('===========================\n', 'bright');
  
  log('📋 ISTRUZIONI:', 'yellow');
  log('1. Apri Chrome/Firefox e vai su http://localhost:3000', 'cyan');
  log('2. Fai login con: admin@mantaaero.com / password123', 'cyan');
  log('3. Apri DevTools (F12) → Network → ricarica pagina', 'cyan');
  log('4. Trova una richiesta a /api/* → tasto destro → Copy as cURL', 'cyan');
  log('5. Estrai il valore -H "Cookie: ..." dal comando copiato', 'cyan');
  log('6. Sostituisci YOUR_COOKIE nei comandi sotto con quel valore\n', 'cyan');
  
  log('⚠️  IMPORTANTE: I cookie scadono! Se i test falliscono, ripeti il login.\n', 'red');
  
  // Variabile per cookie
  log('# Imposta la variabile con il tuo cookie (bash/zsh):', 'green');
  log('export COOKIE="YOUR_COOKIE_HERE"', 'yellow');
  log('# Esempio: export COOKIE="authjs.csrf-token=abc123; authjs.session-token=xyz789"\n', 'dim');
  
  // Test 1: Lista parti
  log('\n📋 TEST 1: LISTA PARTI', 'bright');
  log('# Lista base:', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  log('\n# Con parametri di ricerca:', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts?search=8G&limit=5&sortBy=createdAt&sortOrder=desc" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  log('\n# Solo parti attive:', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts?isActive=true" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  // Test 2: Crea parte
  log('\n\n➕ TEST 2: CREA PARTE', 'bright');
  log('# Crea una nuova parte:', 'green');
  log(`curl -X POST "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log(`  -d '{"partNumber":"${TEST_PART_NUMBER}","description":"Parte di test creata via cURL"}' | jq .`, 'yellow');
  
  log('\n# Salva l\'ID della parte creata:', 'green');
  log(`PART_ID=$(curl -X POST "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log(`  -d '{"partNumber":"${TEST_PART_NUMBER}2","description":"Seconda parte di test"}' \\`, 'yellow');
  log('  | jq -r \'.id\')', 'yellow');
  log('echo "Created part with ID: $PART_ID"', 'yellow');
  
  // Test 3: Recupera parte per ID
  log('\n\n🔍 TEST 3: RECUPERA PARTE PER ID', 'bright');
  log('# Usa l\'ID salvato sopra:', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts/$PART_ID" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  // Test 4: Aggiorna parte
  log('\n\n✏️  TEST 4: AGGIORNA PARTE', 'bright');
  log('# Aggiorna la descrizione:', 'green');
  log(`curl -X PUT "${BASE_URL}/api/parts/$PART_ID" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log('  -d \'{"description":"Descrizione aggiornata via cURL"}\' | jq .', 'yellow');
  
  log('\n# Aggiorna partNumber e descrizione:', 'green');
  log(`curl -X PUT "${BASE_URL}/api/parts/$PART_ID" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log(`  -d '{"partNumber":"${TEST_PART_NUMBER}UPDATED","description":"Completamente aggiornata"}' | jq .`, 'yellow');
  
  // Test 5: Elimina parte
  log('\n\n🗑️  TEST 5: ELIMINA PARTE', 'bright');
  log('# Elimina la parte creata:', 'green');
  log(`curl -X DELETE "${BASE_URL}/api/parts/$PART_ID" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  log('\n# Verifica che sia stata eliminata (dovrebbe dare 404):', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts/$PART_ID" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  // Test errori
  log('\n\n❌ TEST 6: GESTIONE ERRORI', 'bright');
  log('# Parte con formato non valido:', 'green');
  log(`curl -X POST "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log('  -d \'{"partNumber":"INVALID-PART!","description":"Dovrebbe fallire"}\' | jq .', 'yellow');
  
  log('\n# Campo mancante:', 'green');
  log(`curl -X POST "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Cookie: $COOKIE" \\', 'yellow');
  log('  -H "Content-Type: application/json" \\', 'yellow');
  log('  -d \'{"partNumber":"NODESCRIZIONE"}\' | jq .', 'yellow');
  
  log('\n# Senza autenticazione:', 'green');
  log(`curl -X GET "${BASE_URL}/api/parts" \\`, 'yellow');
  log('  -H "Accept: application/json" | jq .', 'yellow');
  
  // Script completo
  log('\n\n📜 SCRIPT BASH COMPLETO', 'bright');
  log('# Salva questo in test-parts.sh:', 'green');
  log('\n#!/bin/bash', 'magenta');
  log('set -e', 'magenta');
  log('', 'magenta');
  log('# Configura il cookie', 'magenta');
  log('COOKIE="YOUR_COOKIE_HERE"', 'magenta');
  log(`BASE_URL="${BASE_URL}"`, 'magenta');
  log('', 'magenta');
  log('echo "🧪 Testing Parts API..."', 'magenta');
  log('', 'magenta');
  log('# 1. Lista parti', 'magenta');
  log('echo -e "\\n📋 Lista parti:"', 'magenta');
  log('curl -s -X GET "$BASE_URL/api/parts?limit=3" -H "Cookie: $COOKIE" | jq \'.data[] | {id, partNumber, description}\'', 'magenta');
  log('', 'magenta');
  log('# 2. Crea parte', 'magenta');
  log('echo -e "\\n➕ Creazione parte:"', 'magenta');
  log(`PART_ID=$(curl -s -X POST "$BASE_URL/api/parts" \\`, 'magenta');
  log('  -H "Cookie: $COOKIE" \\', 'magenta');
  log('  -H "Content-Type: application/json" \\', 'magenta');
  log(`  -d '{"partNumber":"TEST'$(date +%s)'","description":"Test parte"}' \\`, 'magenta');
  log('  | jq -r \'.id\')', 'magenta');
  log('echo "Created part ID: $PART_ID"', 'magenta');
  log('', 'magenta');
  log('# 3. Aggiorna parte', 'magenta');
  log('echo -e "\\n✏️  Aggiornamento parte:"', 'magenta');
  log('curl -s -X PUT "$BASE_URL/api/parts/$PART_ID" \\', 'magenta');
  log('  -H "Cookie: $COOKIE" \\', 'magenta');
  log('  -H "Content-Type: application/json" \\', 'magenta');
  log('  -d \'{"description":"Aggiornata"}\' | jq \'{id, partNumber, description}\'', 'magenta');
  log('', 'magenta');
  log('# 4. Elimina parte', 'magenta');
  log('echo -e "\\n🗑️  Eliminazione parte:"', 'magenta');
  log('curl -s -X DELETE "$BASE_URL/api/parts/$PART_ID" -H "Cookie: $COOKIE" | jq .', 'magenta');
  log('', 'magenta');
  log('echo -e "\\n✅ Test completati!"', 'magenta');
  
  // Note finali
  log('\n\n📝 NOTE UTILI:', 'bright');
  log('• Se non hai jq installato: sudo apt-get install jq (Linux) o brew install jq (Mac)', 'cyan');
  log('• Per salvare output: aggiungi > output.json alla fine del comando', 'cyan');
  log('• Per vedere headers HTTP: aggiungi -v (verbose) al comando curl', 'cyan');
  log('• Per misurare tempi: aggiungi -w "\\nTime: %{time_total}s\\n"', 'cyan');
  
  log('\n✨ Buon testing!', 'green');
}

// Run
generateTests();