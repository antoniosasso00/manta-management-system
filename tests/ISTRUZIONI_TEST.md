# 📋 ISTRUZIONI PER ESEGUIRE I TEST

## ⚠️ Situazione Attuale

Il server Next.js sta rispondendo con errore 500 su tutte le richieste. Questo può essere dovuto a:
- Problema di configurazione ambiente
- Errore nel codice
- Problema con le dipendenze

## 🔧 Come Risolvere

1. **Controlla la console dove è in esecuzione `npm run dev`**
   - Cerca errori rossi o stack trace
   - Copia l'errore completo

2. **Verifica ambiente**:
   ```bash
   # Controlla .env.local
   cat .env.local
   
   # Deve contenere almeno:
   # DATABASE_URL="postgresql://..."
   # NEXTAUTH_SECRET="..."
   # NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Riavvia il server**:
   ```bash
   # Termina il processo corrente (Ctrl+C)
   # Riavvia
   npm run dev
   ```

## 🧪 Test Disponibili

### 1. Test dal Browser (CONSIGLIATO)

Una volta risolto l'errore 500:

1. Apri http://localhost:3000
2. Login con `admin@mantaaero.com` / `password123`
3. Apri Console (F12)
4. Esegui uno di questi script:

#### Test Generale Completo
```javascript
// Copia e incolla in console
await fetch('/tests/e2e/browser-test-script.js')
  .then(r => r.text())
  .then(eval);
```

#### Test Estensioni Database
```javascript
// Copia e incolla in console
await fetch('/tests/e2e/test-extensions.js')
  .then(r => r.text())
  .then(eval);
```

#### Test Workflow e QR
```javascript
// Copia e incolla in console
await fetch('/tests/e2e/test-qr-workflow.js')
  .then(r => r.text())
  .then(eval);
```

### 2. Test Node.js (con Cookie)

Se preferisci test da terminale:

1. Ottieni il cookie di sessione (vedi `tests/scripts/get-session-cookie.md`)
2. Modifica `SESSION_COOKIE` in `tests/api/test-with-cookies.js`
3. Esegui:
   ```bash
   node tests/api/test-with-cookies.js
   ```

### 3. Test Runner Automatico

Una volta che il server funziona:
```bash
node tests/run-all-tests.js
```

## 📁 Struttura Test

```
tests/
├── api/                    # Test API con autenticazione
│   └── test-with-cookies.js
├── e2e/                    # Test end-to-end browser
│   ├── browser-test-script.js
│   ├── test-extensions.js
│   └── test-qr-workflow.js
├── scripts/                # Utility e helper
│   └── get-session-cookie.md
├── results/                # Report dei test
│   └── TEST_RESULTS.md
└── run-all-tests.js       # Runner principale
```

## 🎯 Sequenza Test Consigliata

1. **Fix errore 500** controllando console Next.js
2. **Login** nel browser
3. **Esegui** `browser-test-script.js` dalla console
4. **Verifica** risultati nella console
5. **Esegui** altri test specifici se necessario

## 💡 Suggerimenti

- Gli errori 500 sono spesso dovuti a:
  - DATABASE_URL non configurato
  - Prisma client non generato (`npm run db:generate`)
  - Database non migrato (`npm run db:push`)
  - Mancanza di NEXTAUTH_SECRET

- Per debug dettagliato:
  - Aggiungi `console.log` nel codice API
  - Controlla Network tab nel browser
  - Verifica Response headers per dettagli errore