# Report Audit Navigazione - MES Aerospazio

**Data:** 2025-07-04  
**Versione:** 1.0  
**Autore:** Claude Code Analysis

## Sommario Esecutivo

Questo report identifica tutti i redirect e navigazioni verso pagine non esistenti nel sistema MES Aerospazio. L'analisi ha rivelato 12 percorsi critici non funzionanti che causano errori 404 agli utenti.

## Statistiche

- **Punti di Navigazione Analizzati:** 47
- **Percorsi Rotti/Mancanti:** 12 
- **Percorsi Potenzialmente Rischiosi:** 4
- **Percorsi Corretti:** 31
- **Tasso di Successo:** 66%

---

## 🚨 PROBLEMI CRITICI (Priorità 1)

### 1. Menu Utente - Navigazione Rotta
**File:** `src/components/auth/UserMenu.tsx`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 144 | `router.push('/auth/profile')` | Percorso non esiste | ❌ ROTTO |
| 152 | `router.push('/auth/change-password')` | Percorso non esiste | ❌ ROTTO |
| 160 | `router.push('/settings')` | Route group non accessibile | ❌ ROTTO |
| 182 | `signOut({ callbackUrl: '/auth/login' })` | Percorso non esiste | ❌ ROTTO |

**Impatto:** Gli utenti non possono accedere al profilo, cambiare password o logout correttamente.

**Soluzione:**
```typescript
// Sostituire:
router.push('/auth/profile')      → router.push('/profile')
router.push('/auth/change-password') → router.push('/change-password')
router.push('/settings')         → router.push('/settings') // verificare route group
signOut({ callbackUrl: '/auth/login' }) → signOut({ callbackUrl: '/login' })
```

### 2. Dashboard - Percorso Principale Inaccessibile
**File:** `src/config/navigationConfig.ts`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 49, 209, 251 | `href: '/dashboard'` | Percorso non raggiungibile | ❌ ROTTO |

**Impatto:** L'icona "Home" nella navigazione non funziona.

**Soluzione:** Valutare se utilizzare `href: '/'` o creare redirect a `/dashboard`.

### 3. Pagina Audit Admin Mancante
**File:** `src/config/navigationConfig.ts`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 227 | `href: '/admin/audit'` | Percorso struttura errata | ❌ ROTTO |

**Impatto:** Gli admin non possono accedere ai log di audit.

**Soluzione:** Cambiare a `href: '/admin/monitoring/audit'`.

---

## ⚠️ PROBLEMI MAGGIORI (Priorità 2)

### 4. ODL - Pagine Dinamiche Mancanti
**File:** `src/app/(dashboard)/production/page.tsx`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 475 | `href={/production/odl/${odl.id}}` | Pagina dinamica mancante | ❌ MANCANTE |

**File:** `src/app/(dashboard)/production/odl/page.tsx`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 348 | `href="/production/odl/create"` | Pagina create mancante | ❌ MANCANTE |
| 411 | `href={/production/odl/${odl.id}}` | Pagina dettaglio mancante | ❌ MANCANTE |
| 415 | `href={/production/odl/${odl.id}/edit}` | Pagina edit mancante | ❌ MANCANTE |

**Impatto:** Impossibile creare, visualizzare o modificare ODL dalla UI.

**Soluzione:** Creare le pagine mancanti:
- `/(dashboard)/production/odl/create/page.tsx`
- `/(dashboard)/production/odl/[id]/page.tsx`
- `/(dashboard)/production/odl/[id]/edit/page.tsx`

### 5. QR Labels - Percorso Inaccessibile
**File:** `src/config/navigationConfig.ts`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 85 | `href: '/qr-labels'` | Route group non accessibile | ❌ ROTTO |

**Impatto:** Menu QR Labels non funzionante.

---

## ⚠️ PERCORSI RISCHIOSI (Priorità 3)

### 6. Redirect Principali
**File:** `src/app/page.tsx`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 9, 13 | `redirect('/dashboard')` e `redirect('/auth/login')` | Percorsi route group | ⚠️ RISCHIOSO |

**Impatto:** Potrebbero funzionare ma non garantito.

### 7. Middleware di Autenticazione
**File:** `src/middleware.ts`

| Linea | Codice | Problema | Stato |
|-------|---------|----------|--------|
| 63, 69 | `new URL('/login?from=...', req.url)` | Percorso route group | ⚠️ RISCHIOSO |

**Impatto:** Redirect di autenticazione potrebbero fallire.

---

## ✅ PERCORSI CORRETTI

### Navigazione Principale
- `/production` → `/(dashboard)/production/page.tsx` ✅
- `/my-department` → `/(dashboard)/my-department/page.tsx` ✅
- `/qr-scanner` → `/(dashboard)/qr-scanner/page.tsx` ✅
- `/admin/users` → `/(dashboard)/admin/users/page.tsx` ✅
- `/parts` → `/(dashboard)/parts/page.tsx` ✅
- `/planning` → `/(dashboard)/planning/page.tsx` ✅

### Autenticazione
- Form login/register utilizzano percorsi route group corretti ✅
- Flow password reset implementato correttamente ✅

---

## 🔧 PIANO DI RISOLUZIONE

### Fase 1: Fix Critici (Immediati)
1. **Correggere UserMenu.tsx**
   - Aggiornare tutti i percorsi di navigazione
   - Testare flusso completo autenticazione

2. **Correggere navigationConfig.ts**
   - Aggiornare percorsi dashboard e audit
   - Verificare accessibilità route group

### Fase 2: Pagine Mancanti (Entro 1 settimana)
3. **Creare pagine ODL dinamiche**
   - Implementare CRUD completo ODL
   - Aggiungere validazione e error handling

4. **Verificare QR Labels**
   - Testare accessibilità percorso
   - Implementare se mancante

### Fase 3: Ottimizzazione (Entro 2 settimane)
5. **Standardizzare middleware**
   - Unificare percorsi di redirect
   - Aggiungere test di integrazione

6. **Documentare convenzioni**
   - Creare guida route group
   - Aggiornare CLAUDE.md

---

## 🧪 COMANDI DI VERIFICA

### Test Navigazione
```bash
# Avvia server di sviluppo
npm run dev

# Testa percorsi principali
curl -I http://localhost:3000/dashboard
curl -I http://localhost:3000/auth/profile
curl -I http://localhost:3000/production/odl/123
```

### Test Autenticazione
```bash
# Verifica redirect login
curl -I http://localhost:3000/production
# Dovrebbe reindirizzare a login

# Verifica logout
# Testare tramite browser con utente autenticato
```

---

## 📝 NOTE TECNICHE

### Route Group in Next.js 13+
I route group `(auth)` e `(dashboard)` creano percorsi senza il gruppo nel URL:
- `/(auth)/login/page.tsx` → URL: `/login`
- `/(dashboard)/production/page.tsx` → URL: `/production`

### Convenzione Percorsi
- **Percorsi assoluti:** Utilizzare sempre percorsi dal root (`/login` non `/auth/login`)
- **Route dinamiche:** Utilizzare bracket notation `[id]` per parametri
- **Gruppi logici:** Utilizzare route group per organizzazione senza impatto URL

---

## 🚨 AZIONI IMMEDIATE RICHIESTE

1. **CRITICO:** Correggere UserMenu.tsx prima del prossimo deploy
2. **URGENTE:** Implementare pagine ODL mancanti per completare workflow
3. **IMPORTANTE:** Verificare e correggere tutti i percorsi nella navigationConfig.ts

---

## 📋 SPECIFICHE DETTAGLIATE PAGINE MANCANTI

### 1. **Dashboard Principale** `/dashboard`
**Tipo:** Landing Page con Overview Sistema

**Contenuti:**
- **KPI Basici Dashboard:**
  - ODL totali in lavorazione
  - Percentuale completamento giornaliero
  - Tempo medio per reparto
  - Allarmi attivi (ritardi, problemi)
  
- **Shortcuts Rapidi:**
  - Nuovo ODL (button principale)
  - Scansione QR
  - Stampa etichette
  - Accesso rapido ai reparti
  
- **Sistema Notifiche:**
  - Notifiche in tempo reale
  - Allarmi produzione
  - Messaggi sistema
  - Badge contatori

**Layout:** Grid 3 colonne con cards Material-UI
**Aggiornamento:** Real-time con WebSocket/polling

---

### 2. **ODL - Pagina Creazione** `/production/odl/create`
**Tipo:** Form Singolo con Ricerca Integrata

**Campi Obbligatori:**
- **Progressivo ODL:** Input univoco auto-generato/manuale
- **Part Number:** Ricerca rapida con autocomplete nel catalogo parti
- **Descrizione:** Auto-popolata dalla parte selezionata
- **Priorità:** Dropdown (BASSA, MEDIA, ALTA, CRITICA)
- **Note:** Textarea opzionale

**Funzionalità Ricerca Parti:**
- Autocomplete con debounce (300ms)
- Ricerca per codice o descrizione
- Preview dati parte selezionata
- **Shortcut Creazione Parte:** Modal inline se parte non esiste

**Logica Associazione Tools/Cicli:**
- **Selezione Automatica:** Solo se relazione univoca
- **Selezione Manuale:** Checkbox multipla se più opzioni
- **Configurazione Posticipata:** ODL può avanzare senza configurazione completa

**Validazione:**
- Progressivo ODL univoco (check real-time)
- Part Number esistente o creazione confermata
- Campi obbligatori compilati

---

### 3. **ODL - Pagina Dettaglio** `/production/odl/[id]`
**Tipo:** Dashboard Completo ODL

**Sezioni Principali:**
1. **Header Info ODL:**
   - Progressivo, Part Number, Descrizione
   - Stato corrente, Priorità
   - Visualizzazione QR Code (con download)

2. **Storico Eventi Produzione:**
   - Timeline eventi con timestamp
   - Dettagli per reparto
   - Operatori coinvolti
   - Durata per fase

3. **Configurazioni per Reparto:**
   - Tabs per ogni reparto (Clean Room, Autoclavi, NDI, etc.)
   - Configurazione tools e parametri
   - Dati supplementari department-specific

4. **Azioni Rapide:**
   - Trasferimento diretto tra reparti
   - Stampa etichette specifiche
   - Modifica priorità
   - Aggiunta note operative

**Accesso:** Tutti i ruoli possono visualizzare, modifica basata su permessi reparto

---

### 4. **ODL - Pagina Modifica** `/production/odl/[id]/edit`
**Tipo:** Form Modifica con Controlli Avanzati

**Campi Modificabili:**
- **Part Number:** Con dialog conferma + attesa validazione
- **Descrizione:** Libera modifica
- **Priorità:** Dropdown con log automatico
- **Note:** Aggiunta/modifica con timestamp
- **Configurazioni Reparto:** Basate su ruolo utente

**Controlli Speciali:**
- **Modifica Part Number:** 
  - Dialog conferma con warning impatti
  - Attesa validazione (3 secondi)
  - Check disponibilità nuovo codice
  
**Logging Automatico:**
- Ogni modifica tracciata con: utente, timestamp, campo, valore precedente/nuovo
- Visualizzazione log modifiche in timeline
- Export log per audit

**Validazione:**
- Controllo permessi per campo
- Validazione business rules
- Conferma modifiche critiche

---

### 5. **QR Labels - Gestione Etichette** `/qr-labels`
**Tipo:** Sistema Completo Gestione Etichette

**Funzionalità Principali:**
1. **Selezione ODL per Stampa:**
   - Lista ODL con filtri
   - Selezione multipla checkbox
   - Preview QR generati

2. **Configurazione Stampa:**
   - **Formato Carta:** A4, A5, personalizzato
   - **Matrice Stampa:** 4 QR per foglio (default), configurabile 2x2, 3x3, 4x4
   - **Dimensioni QR:** Small (2cm), Medium (3cm), Large (4cm)
   - **Margini:** Configurabili per stampante

3. **Gestione Tracking:**
   - **Checkbox Stampa:** Si attiva quando etichette mandate in stampa
   - **Storico Stampe:** Log con timestamp e utente
   - **Stato Etichette:** Stampate, In uso, Scadute

4. **Preview e Download:**
   - Anteprima PDF prima stampa
   - Download PDF per stampa offline
   - Salvataggio template configurazioni

**Workflow:**
ODL Selection → Configuration → Preview → Print → Tracking Update

---

### 6. **Settings - Impostazioni** `/settings`
**Tipo:** Multi-Tab Settings seguendo Best Practices

**Struttura Tab:**
1. **👤 Profilo Utente:**
   - Foto profilo (opzionale, upload/crop)
   - Dati personali (nome, email, telefono)
   - Preferenze linguaggio
   - Fuso orario

2. **🔔 Notifiche:**
   - Notifiche email (ODL, allarmi, report)
   - Notifiche push browser
   - Frequenza digest
   - Canali preferiti

3. **🎨 Preferenze UI:**
   - Tema (Light/Dark/Auto)
   - Dimensione font
   - Densità tabelle
   - Shortcuts tastiera

4. **🔗 Integrazione Gamma:**
   - Stato sincronizzazione
   - Frequenza sync
   - Mapping campi personalizzati
   - Log errori sync

5. **🔐 Sicurezza:**
   - Cambio password
   - Sessioni attive
   - Log accessi
   - Autenticazione 2FA (futuro)

**Salvataggio:** Auto-save con feedback visivo + pulsante salva manuale

---

### 7. **Admin Audit - Log Sistema** `/admin/monitoring/audit`
**Tipo:** Dashboard Completo Audit Trail

**Eventi Tracciati:**
- **Autenticazione:** Login, logout, failed attempts
- **ODL Operations:** Create, update, delete, transfer
- **User Management:** User creation, role changes, deactivation
- **System Events:** Database changes, configuration updates
- **Production Events:** QR scans, department transfers, status changes

**Filtri Disponibili:**
- **Periodo:** Oggi, Settimana, Mese, Custom range
- **Utente:** Dropdown tutti utenti sistema
- **Tipo Evento:** Checkbox multiple per categorie
- **Livello:** Info, Warning, Error, Critical
- **Reparto:** Filtro per department-specific events

**Funzionalità:**
- **Ricerca Testuale:** Search in event details
- **Export:** CSV, PDF, Excel con filtri applicati
- **Visualizzazione:** Tabella paginata + timeline view
- **Dettagli:** Modal con JSON completo evento

**Metriche Dashboard:**
- Eventi per giorno (grafico)
- Top utenti attivi
- Errori recenti
- Statistiche accessi

---

### 8. **Profile - Profilo Utente** `/profile`
**Tipo:** Pagina Profilo Completa

**Sezioni:**
1. **Informazioni Personali:**
   - Foto profilo (upload, crop, delete)
   - Nome, cognome, email
   - Ruolo sistema e reparto
   - Data ultimo accesso

2. **Statistiche Attività:**
   - ODL processati (oggi, settimana, mese)
   - Tempo medio per operazione
   - Reparti frequentati
   - Grafico attività giornaliera

3. **Preferenze Rapide:**
   - Shortcut alle impostazioni più usate
   - Tema UI
   - Notifiche principali

4. **Accesso Rapido:**
   - Cambia password
   - Gestisci sessioni
   - Download dati personali (GDPR)

**Sicurezza:**
- Modifica dati sensibili richiede conferma password
- Log modifiche profilo
- Controllo accesso basato su ruolo

---

## 🔧 PIANO IMPLEMENTAZIONE AGGIORNATO

### Fase 1: Pagine Critiche (Priorità Immediata)
1. **Dashboard Principale** - Landing page con KPI e shortcuts
2. **ODL Create** - Form creazione con ricerca parti integrata
3. **UserMenu Fix** - Correzione percorsi navigazione

### Fase 2: Workflow Completo ODL (Entro 1 settimana)
4. **ODL Detail** - Pagina dettaglio con storico e configurazioni
5. **ODL Edit** - Modifica con logging e controlli avanzati
6. **QR Labels** - Sistema stampa etichette con matrice configurabile

### Fase 3: Amministrazione e Profilo (Entro 2 settimane)
7. **Settings** - Multi-tab con best practices
8. **Admin Audit** - Dashboard completo log sistema
9. **Profile** - Pagina profilo con statistiche attività

### Fase 4: Ottimizzazioni (Entro 3 settimane)
10. **Performance** - Ottimizzazione query e caching
11. **Mobile** - Responsive design e PWA
12. **Testing** - Unit tests e integration tests

---

**Report generato automaticamente da Claude Code Analysis**  
**Prossimo aggiornamento:** Da pianificare dopo implementazione fix