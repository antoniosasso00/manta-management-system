# Definizione MVP - MES Aerospazio

## 1. Panoramica MVP

### 1.1 Obiettivo
Sistema MES funzionante per il monitoraggio completo di **Clean Room (Laminazione)** e **Autoclavi (Cicli di Cura)** con tracciamento QR e ottimizzazione batch automatica.

### 1.2 Timeline
- **Durata**: 8 settimane (240 ore)
- **Go-live**: Fine settimana 8
- **Test operatori**: Settimana 6
- **Deploy staging**: Settimana 3

### 1.3 Success Criteria
- ✅ 100% ODL tracciati attraverso Clean Room e Autoclavi
- ✅ Algoritmo autoclavi con efficienza >80%
- ✅ QR scan success rate >99%
- ✅ Sync Gamma automatica senza errori
- ✅ Report tempi accurati ±5%

## 2. Funzionalità Incluse nell'MVP

### 2.1 Sistema Autenticazione ✅
**Settimana 1**
```
□ Login/logout con username e password
□ Ruoli utente: Operatore, Capo Reparto, Responsabile, Admin
□ Sessioni sicure con JWT
□ Middleware protezione routes
□ UI login responsive per mobile
```

**Specifiche**:
- Hash password con bcrypt (12 rounds)
- JWT con refresh token (7 giorni)
- Role-based access control
- Logout automatico dopo inattività (2 ore)

### 2.2 Sistema QR Code Completo ✅
**Settimana 2**
```
□ Generazione QR univoci per ogni ODL
□ Scanner QR ottimizzato per mobile
□ Validazione e parsing QR data
□ Associazione QR → ODL automatica
□ Gestione errori scansione con feedback
```

**Specifiche**:
- QR format: JSON con ODL ID, timestamp, checksum
- Scanner: html5-qrcode con UI mobile-friendly
- Stampa QR: formato 4x4cm per etichette
- Storage QR: database con log scansioni

### 2.3 Gestione Ordini di Lavoro (ODL) ✅
**Settimana 3**
```
□ CRUD completo ODL (create, read, update, delete)
□ Campi: ODL number, Part Number, descrizione, quantità, scadenza
□ Stati ODL: Pending, In Progress, Completed, Cancelled
□ Filtri e ricerca per numero, parte, stato
□ Validazione dati con Zod schemas
```

**Specifiche**:
- ODL number: formato alfanumerico univoco
- Part Number: regex validation formato aziendale
- Due date: validazione data futura
- Interfaccia tabellare con sorting e pagination

### 2.4 Tracciamento Eventi Produzione ✅
**Settimana 3-4**
```
□ Eventi: ENTER, EXIT, START, COMPLETE per ogni reparto
□ Timestamp automatico su scansione QR
□ Associazione operatore → evento
□ Log audit completo di tutte le operazioni
□ Dashboard real-time eventi in corso
```

**Specifiche**:
- Precisione timestamp: millisecondi
- Validazione: impossibile EXIT senza ENTER
- Audit log: immutabile, con user tracking
- Real-time: aggiornamenti ogni 5 secondi

### 2.5 Reparto Clean Room (Laminazione) ✅
**Settimana 4**
```
□ Workflow completo: scansione ingresso → lavorazione → scansione uscita
□ Calcolo tempi permanenza automatico
□ Confronto tempi effettivi vs standard
□ Alert automatici per ritardi >20%
□ Dashboard stato Clean Room real-time
```

**Specifiche**:
- Capacità: 6 operatori simultanei
- Tempi standard: configurabili per Part Number
- Alert threshold: configurabile (default 20%)
- Dashboard: aggiornamento ogni 10 secondi

### 2.6 Sistema Autoclavi con Ottimizzazione ✅
**Settimana 5-6** - **PRIORITÀ CRITICA**
```
□ Gestione 3 autoclavi con diverse dimensioni
□ Algoritmo ottimizzazione batch multi-ODL
□ Visualizzazione 2D posizionamento pezzi
□ Considerazione vincoli: cicli, dimensioni, priorità
□ Calcolo efficienza utilizzo spazio
```

**Specifiche Algoritmo**:
- Input: Lista ODL pronti per cura
- Vincoli: Cicli compatibili, dimensioni massime, linee vuoto
- Output: Batch ottimizzato con posizioni X,Y
- Performance: Ottimizzazione <30 secondi
- Efficienza target: >80% utilizzo spazio

**Visualizzazione 2D**:
- Canvas responsive per piano autoclave
- Colori per priorità: Rosso=Urgent, Giallo=High, Verde=Normal
- Tooltip con dettagli ODL al hover
- Export layout PDF per operatori

### 2.7 Sincronizzazione MES Gamma ✅
**Settimana 7**
```
□ File watcher automatico su cartella export
□ Parser robusto CSV/Excel files
□ Import automatico: ODL, Part Number, Descrizioni
□ Queue processing con retry logic
□ Log errori e notifiche admin
```

**Specifiche**:
- Watch folder: `/gamma-exports/`
- Formati supportati: CSV, XLSX
- Frequenza check: ogni 30 secondi
- Retry: 3 tentativi con backoff exponential
- Archive: file processati spostati in `/processed/`

### 2.8 Reporting Essenziale ✅
**Settimana 7**
```
□ Report tempi produzione per ODL/Part Number
□ Report efficienza batch autoclavi
□ Statistiche giornaliere/settimanali per reparto
□ Export PDF/Excel per management
□ Dashboard KPI real-time
```

**Reports Inclusi**:
1. **Production Times**: ODL con tempi effettivi vs standard
2. **Autoclave Efficiency**: % utilizzo spazio per batch
3. **Department Statistics**: Throughput, tempi medi, alert count
4. **Daily Summary**: ODL completati, ritardi, efficiency score

### 2.9 Sistema Notifiche Base ✅
**Settimana 7-8**
```
□ Notifiche in-app per ritardi produzione
□ Alert dashboard per anomalie
□ Email notifications per management
□ (Opzionale) Telegram integration
```

**Notifiche Incluse**:
- Ritardo ODL >20% tempo standard
- Batch autoclave completato
- Errori sincronizzazione Gamma
- Alert sistema (downtime, errori DB)

## 3. Architettura MVP

### 3.1 Stack Tecnologico
```json
{
  "frontend": {
    "framework": "Next.js 15 (App Router)",
    "ui": "Material-UI v6",
    "state": "Zustand + React Query",
    "styling": "Tailwind CSS + MUI System"
  },
  "backend": {
    "api": "Next.js API Routes",
    "database": "PostgreSQL + Prisma",
    "jobs": "BullMQ for background tasks",
    "auth": "NextAuth.js + JWT"
  },
  "deployment": {
    "staging": "Netlify (frontend) + ngrok (backend)",
    "production": "Server aziendale (full stack)"
  }
}
```

### 3.2 Database Schema Essenziale
```sql
-- Core tables per MVP
users (id, username, password_hash, role, name, active)
work_orders (id, odl_number, part_number, description, quantity, due_date, status)
departments (id, name, code, type, capacity)
production_events (id, work_order_id, department_id, event_type, timestamp, operator_id)
qr_codes (id, work_order_id, code, created_at, scans_count)
autoclaves (id, name, width, height, max_temp, active)
production_batches (id, autoclave_id, start_time, end_time, status, efficiency)
batch_items (id, batch_id, work_order_id, position_x, position_y)
```

### 3.3 API Endpoints Essenziali
```typescript
// Authentication
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

// Work Orders
GET    /api/work-orders
POST   /api/work-orders
PUT    /api/work-orders/:id
DELETE /api/work-orders/:id

// Production Events
POST /api/events/scan-qr
GET  /api/events/department/:id
POST /api/events/manual

// QR Management
POST /api/qr/generate/:odlId
GET  /api/qr/:code/validate

// Autoclaves
GET  /api/autoclaves
POST /api/autoclaves/:id/optimize
POST /api/batches
GET  /api/batches/:id/layout

// Reports
GET /api/reports/production-times
GET /api/reports/autoclave-efficiency
GET /api/reports/department-stats

// Gamma Sync
POST /api/gamma/sync/manual
GET  /api/gamma/sync/status
```

## 4. Interfaccia Utente MVP

### 4.1 Layout Principale
```
┌─────────────────────────────────────────┐
│ [Logo] MES Aerospazio    [User] [Logout]│
├─────────────────────────────────────────┤
│ [Dashboard] [Produzione] [Report] [Admin]│
├─────────────────────────────────────────┤
│                                         │
│           Main Content Area             │
│                                         │
└─────────────────────────────────────────┘
```

### 4.2 Pagine Principali
1. **Dashboard**: KPI real-time, alert, stato reparti
2. **Produzione**: Lista ODL, scanner QR, stato lavorazioni
3. **Autoclavi**: Ottimizzazione batch, visualizzazione 2D
4. **Report**: Tempi, efficienza, statistiche
5. **Admin**: Gestione utenti, configurazioni

### 4.3 Mobile Interface (Operatori)
- **Scanner QR**: Fullscreen con feedback immediato
- **Dashboard semplificata**: Solo informazioni essenziali
- **Font size**: Minimo 16px per leggibilità
- **Touch targets**: Minimo 44px per operatori con guanti

## 5. Non Incluso nell'MVP

### 5.1 Funzionalità Rimandate alla Fase 2
- ❌ Altri reparti (NDI, Rifilatura CN, Verniciatura)
- ❌ Gestione scarti e rilavorazioni
- ❌ Integration Quarta software
- ❌ Mobile app nativa
- ❌ Advanced analytics/ML
- ❌ Multi-lingua support
- ❌ SSO/Active Directory
- ❌ Advanced workflow automation

### 5.2 Ottimizzazioni Rimandate
- ❌ Algoritmo autoclavi con OR-Tools
- ❌ Machine learning tempi predittivi
- ❌ Real-time collaboration
- ❌ Advanced caching strategies
- ❌ Microservices architecture

## 6. Testing Strategy MVP

### 6.1 Test Phases
**Settimana 3**: Unit testing core functions
**Settimana 4**: Integration testing API + DB
**Settimana 6**: User acceptance testing con operatori
**Settimana 8**: Stress testing produzione

### 6.2 Test Scenarios Critici
1. **QR Workflow**: Genera QR → Stampa → Scansione → Evento
2. **Clean Room Flow**: Ingresso → Lavorazione → Uscita → Report tempi
3. **Autoclave Optimization**: Input ODL → Algoritmo → Layout 2D → Batch
4. **Gamma Sync**: Export file → Import → Validazione → Update DB
5. **Mobile Usability**: Scansione QR su smartphone in ambiente produttivo

### 6.3 Performance Targets MVP
- Page load time: <3 secondi (mobile 3G)
- QR scan response: <2 secondi
- Batch optimization: <30 secondi
- Database queries: <200ms (95th percentile)
- Uptime durante orario produttivo: >99%

## 7. Success Metrics & KPIs

### 7.1 Technical Metrics
- Zero data loss durante sync Gamma
- QR scan success rate >99%
- Algoritmo autoclavi efficiency >80%
- API response time <200ms average
- Error rate <0.1%

### 7.2 Business Metrics
- 100% ODL tracciati attraverso Clean Room
- Riduzione 30% tempi setup autoclavi
- Eliminazione errori posizionamento manuale
- Real-time visibility su stato produzione
- Report automatici vs manuali precedenti

### 7.3 User Adoption Metrics
- 100% capi reparto utilizzano dashboard quotidianamente
- 90% operatori completano workflow QR correttamente
- <5 minuti training necessario per scanner QR
- Zero resistance to adoption da parte operatori

## 8. Go-Live Checklist

### 8.1 Technical Readiness
```
□ Database backup automatico configurato
□ SSL certificati installati e validi
□ Monitoring e logging attivi
□ Performance testing completato
□ Security scan passato
□ Disaster recovery plan testato
```

### 8.2 Business Readiness
```
□ Training operatori completato
□ Manuale utente disponibile
□ Support process definito
□ Rollback plan preparato
□ Management approval ottenuta
□ Gamma sync testato con dati reali
```

### 8.3 User Acceptance
```
□ Capi reparto sanno utilizzare dashboard
□ Operatori sanno scansionare QR correttamente
□ Management ha accesso a report
□ Algoritmo autoclavi approvato da produzione
□ Tempi tracking validati vs chronometro manuale
```

Questo MVP rappresenta il sistema minimo funzionante che sostituisce completamente il tracking manuale per Clean Room e Autoclavi, fornendo valore immediato e misurabile all'operatività aziendale.