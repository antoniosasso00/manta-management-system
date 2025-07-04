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

---

## 🎯 STATO IMPLEMENTAZIONE FINALE

### ✅ COMPLETATE (Tutte le pagine implementate)

1. **Dashboard Principale** `/dashboard` ✅
   - KPI dashboard con metriche simulate
   - Shortcuts rapidi per tutte le funzioni
   - Sistema notifiche con badge
   - Layout responsive Material-UI

2. **ODL Create** `/production/odl/create` ✅
   - Form completo con validazione Zod
   - Ricerca parti con autocomplete e debounce
   - Shortcut creazione parte inline
   - Validazione progressivo ODL real-time

3. **ODL Detail** `/production/odl/[id]` ✅
   - Timeline eventi produzione completa
   - Tabs per configurazioni reparto
   - QR code generazione e download
   - Sistema trasferimento tra reparti

4. **ODL Edit** `/production/odl/[id]/edit` ✅
   - Form modifica con logging automatico
   - Dialog conferma Part Number con countdown 3s
   - Timeline modifiche con audit trail
   - Validazione avanzata campi critici

5. **QR Labels** `/qr-labels` ✅
   - Matrice configurabile (2x2, 3x3, 4x4, etc.)
   - Template management con localStorage
   - Sistema tracking stampe con checkbox
   - Dialog configurazione stampa avanzata

6. **Settings** `/settings` ✅
   - 5 tab complete: Profilo, Notifiche, UI, Gamma, Sicurezza
   - Auto-save con feedback visivo
   - Dialog cambio password e avatar upload
   - Slider configurazioni e switch controls

7. **Admin Audit** `/admin/monitoring/audit` ✅
   - Dashboard completo con metriche KPI
   - 4 tab: Log Eventi, Analytics, Sicurezza, Configurazione
   - Filtri avanzati e ricerca real-time
   - Auto-refresh con switch control

8. **Profile** `/profile` ✅
   - Statistiche attività complete
   - Upload foto profilo e modifica dati
   - Performance overview con progress bars
   - Timeline attività recente

9. **Navigation Fixes** ✅
   - UserMenu.tsx percorsi corretti
   - navigationConfig.ts aggiornato
   - Middleware percorsi validati

---

## 🔧 MOCKUPS E PLACEHOLDERS RIMASTI

### 1. **Dati Mock utilizzati (Da sostituire con API reale)**

#### Dashboard (`/dashboard`)
```typescript
// MOCK DATA - src/app/(dashboard)/dashboard/page.tsx:29-36
const mockKPIs = {
  odlInProgress: 24,
  odlCompleted: 187,
  completionRate: 78,
  avgTimePerDepartment: 4.2,
  activeAlerts: 3,
  todayProduction: 45
}
```

#### ODL Create (`/production/odl/create`)
```typescript
// MOCK VALIDATION - Linea 89-95
const debouncedOdlCheck = useCallback(
  debounce(async (odlNumber: string) => {
    // TODO: Sostituire con chiamata API reale
    // await fetch('/api/odl/check-unique')
  }, 500), []
)
```

#### Admin Audit (`/admin/monitoring/audit`)
```typescript
// MOCK EVENTS - Linea 140-225
const mockEvents: AuditEvent[] = [
  // 4 eventi demo hardcodati
  // TODO: Sostituire con /api/admin/audit/events
]
```

#### Profile (`/profile`)
```typescript
// MOCK STATS - Linea 54-63
const mockStats: UserStats = {
  odlCreated: 23,
  odlCompleted: 87,
  totalWorkingHours: 156.5,
  // TODO: Recuperare da API /api/user/stats
}
```

### 2. **Funzionalità Placeholder (Alert implementation needed)**

#### Upload Foto (`/profile` e `/settings`)
```typescript
// PLACEHOLDER - Linea 221-224 in profile/page.tsx
const handlePhotoUpload = (event) => {
  // TODO: Implementare upload foto quando sarà definito il sistema di storage
  alert('Upload foto - Da implementare con sistema storage')
}
```

#### Export Audit (`/admin/monitoring/audit`)
```typescript
// PLACEHOLDER - Linea 259-262
const handleExport = () => {
  // TODO: Implementare esportazione quando saranno definiti i requisiti
  alert('Funzione di esportazione da implementare - Richiede specifiche sui formati e contenuti')
}
```

#### Dialog Dettagli Eventi (`/admin/monitoring/audit`)
```typescript
// PLACEHOLDER - Linea 576-577
onClick={() => alert('Dialog dettagli evento - Da implementare')}
```

### 3. **API Endpoints da implementare**

#### Richiesti per funzionamento completo:
- `GET /api/user/stats` - Statistiche utente per Profile
- `GET /api/admin/audit/events` - Eventi audit con filtri
- `POST /api/admin/audit/export` - Esportazione dati audit
- `GET /api/odl/check-unique` - Validazione unicità ODL number
- `PUT /api/user/photo` - Upload foto profilo
- `GET /api/dashboard/kpi` - Metriche KPI real-time
- `GET /api/production/timeline` - Timeline eventi produzione

### 4. **Configurazioni hardcode da esternalizzare**

#### Template QR Labels (`/qr-labels`)
```typescript
// HARDCODE - Template configurations in localStorage
// TODO: Spostare in database con API /api/qr-templates
const defaultTemplates = [
  { id: 'default', name: 'Template Standard', configuration: {...} }
]
```

#### Categorie Audit (`/admin/monitoring/audit`)
```typescript
// HARDCODE - Event categories definition
// TODO: Configurabile via admin panel
const eventCategories = {
  'AUTHENTICATION': { icon: AuthIcon, color: 'primary' },
  // ... altre categorie hardcode
}
```

### 5. **Grafici da implementare (Analytics richiesti)**

#### Admin Audit Analytics Tab
```typescript
// PLACEHOLDER - Richiedera libreria charting
<Alert severity="info">
  Grafici temporali degli eventi - Richiede libreria charting (Recharts?) e specifiche sui periodi
</Alert>
```

**Grafici richiesti:**
- Distribuzione eventi per ora (24h)
- Trend settimanale eventi
- Heatmap attività utenti
- Metriche performance sistema

---

## 🔄 PROSSIMI STEP IMPLEMENTAZIONE

### Immediati (API Integration)
1. **Sostituire mock data** con chiamate API reali
2. **Implementare upload sistema** per foto profilo
3. **Configurare export system** per audit logs (PDF richiesto)

### Breve termine (Funzionalità)
1. **Analytics grafici** con Recharts per audit dashboard
2. **Dialog dettagli eventi** con JSON viewer
3. **Template management** spostato da localStorage a database

### Medio termine (Ottimizzazioni)
1. **Real-time updates** con WebSocket per dashboard KPI
2. **Advanced filtering** con query builder per audit
3. **Mobile optimization** per QR scanner su dispositivi

---

**Report aggiornato dopo implementazione completa**  
**Data aggiornamento:** 2025-07-04  
**Status:** Tutte le pagine implementate con mock data - Ready for API integration**