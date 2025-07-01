# 🚀 MVP Roadmap Sviluppo Funzione per Funzione - MES Aerospazio

## 📋 **Metodologia di Sviluppo**

Ogni step deve essere **completamente verificabile dal frontend** prima di procedere al successivo. Focus su un flusso logico incrementale che costruisce valore business ad ogni iterazione.

---

## 🏗️ **FASE 1: FONDAMENTA QR E TRACKING BASE**

### **STEP 1.1: Sistema QR Code Completo** 
⏱️ **Tempo**: 8-10 ore | 🎯 **Priorità**: CRITICA

#### **Obiettivi**:
- Generazione QR codes per ODL
- Scanner QR mobile-ready  
- Validazione e parsing QR data

#### **Implementazione**:
```typescript
// 1. QR Generator Component
src/components/molecules/QRGenerator.tsx
- Props: odlId, size, downloadable
- Generate QR con formato: {type: "ODL", id: string, timestamp: number}
- Export PDF/PNG per stampa

// 2. QR Scanner Component  
src/components/molecules/QRScanner.tsx
- Camera access con @zxing/browser
- Parsing e validazione QR data
- Success/error feedback immediato
- Supporto upload immagine QR

// 3. QR Management API
src/app/api/qr/generate/route.ts - POST
src/app/api/qr/validate/route.ts - POST
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/qr-test` 
- ✅ **Test 1**: Genera QR per ODL esistente → visualizza QR → scarica PDF
- ✅ **Test 2**: Scansiona QR da mobile → mostra dati ODL parsed
- ✅ **Test 3**: Scansiona QR invalido → mostra errore appropriato
- ✅ **Test 4**: Upload foto QR → parsing corretto

---

### **STEP 1.2: Gestione Eventi Produzione Base**
⏱️ **Tempo**: 6-8 ore | 🎯 **Priorità**: ALTA

#### **Obiettivi**:
- Registrazione eventi ENTRY/EXIT per reparto
- Workflow QR scan → evento automatico
- Dashboard eventi real-time

#### **Implementazione**:
```typescript
// 1. Production Event Service
src/domains/production/services/ProductionEventService.ts
- createEvent(odlId, departmentId, eventType, userId)
- validateEventFlow(odl, eventType) // No EXIT senza ENTRY
- calculateDepartmentTime(odlId, departmentId)

// 2. Event Creation API
src/app/api/production/events/route.ts - POST
src/app/api/production/events/[odlId]/route.ts - GET

// 3. Event Dashboard Component
src/components/organisms/ProductionEventsDashboard.tsx
- Lista eventi in corso per reparto
- Timeline eventi per ODL
- Alert eventi anomali
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/production/events`
- ✅ **Test 1**: Scansiona QR ODL → seleziona reparto → registra ENTRY → vedi evento in dashboard
- ✅ **Test 2**: Registra EXIT per stesso ODL → calcola tempo permanenza → aggiorna dashboard
- ✅ **Test 3**: Tenta EXIT senza ENTRY → ricevi errore validation
- ✅ **Test 4**: Dashboard si aggiorna in real-time (polling ogni 5 sec)

---

## 🧪 **FASE 2: CLEAN ROOM WORKFLOW COMPLETO**

### **STEP 2.1: Modulo Clean Room Base**
⏱️ **Tempo**: 10-12 ore | 🎯 **Priorità**: ALTA

#### **Obiettivi**:
- Workflow completo Clean Room: Ingresso → Lavorazione → Uscita
- Tracking tempi automatico
- Stati ODL specifici per Clean Room

#### **Implementazione**:
```typescript
// 1. Clean Room Service
src/domains/production/services/CleanRoomService.ts
- startCleanRoomWork(odlId, operatorId)
- completeCleanRoomWork(odlId, operatorId)
- getActiveCleanRoomODLs()
- calculateCleanRoomMetrics()

// 2. Clean Room API
src/app/api/production/cleanroom/start/route.ts - POST
src/app/api/production/cleanroom/complete/route.ts - POST
src/app/api/production/cleanroom/status/route.ts - GET

// 3. Clean Room Dashboard
src/app/(dashboard)/production/cleanroom/page.tsx
- ODL attivi in Clean Room
- Operatori attivi con assign ODL
- Metriche tempi medi
- Alert ritardi
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/production/cleanroom`
- ✅ **Test 1**: Scansiona QR ODL → avvia lavorazione Clean Room → ODL passa a IN_CLEANROOM
- ✅ **Test 2**: Dashboard mostra ODL attivo con timer live
- ✅ **Test 3**: Completa lavorazione → ODL passa a CLEANROOM_COMPLETED → calcola tempo totale
- ✅ **Test 4**: Visualizza storico lavorazioni Clean Room con tempi

---

### **STEP 2.2: Time Tracking e Alerting**
⏱️ **Tempo**: 6-8 ore | 🎯 **Priorità**: MEDIA

#### **Obiettivi**:
- Calcolo tempi permanenza Clean Room
- Sistema alert per ritardi
- Report tempi per ODL/Part Number

> **Nota Importante**: I tempi standard e commerciali saranno definiti in questa fase di implementazione, includendo:
> - Tempi standard per Part Number per reparto
> - Soglie alert configurabili per ritardi
> - Tempi target vs effettivi per reportistica management

#### **Implementazione**:
```typescript
// 1. Time Tracking Service
src/domains/production/services/TimeTrackingService.ts
- calculateDepartmentTime(odlId, departmentId)
- compareWithStandardTime(partNumber, actualTime) // Da definire in implementazione
- generateTimeAlerts()

// 2. Time Standards Schema (da aggiungere al database)
// Tabella PartStandardTimes o campi aggiuntivi in Part model

// 3. Time Reports API
src/app/api/reports/time-tracking/route.ts - GET
src/app/api/reports/cleanroom-efficiency/route.ts - GET

// 4. Time Reports Component
src/components/organisms/TimeReports.tsx
- Tabella tempi per ODL
- Grafici performance Clean Room
- Export Excel/PDF
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/reports/time-tracking`
- ✅ **Test 1**: Report mostra ODL completati con tempi effettivi
- ✅ **Test 2**: Alert visibile per ODL con tempo > soglia configurabile
- ✅ **Test 3**: Export report Excel funzionante
- ✅ **Test 4**: Grafici tempi medi per periodo selezionabile

---

## 🏭 **FASE 3: SISTEMA AUTOCLAVI E OTTIMIZZAZIONE**

### **STEP 3.1: Gestione Autoclavi Base**
⏱️ **Tempo**: 8-10 ore | 🎯 **Priorità**: ALTA

#### **Obiettivi**:
- CRUD Autoclavi con specifiche tecniche
- Gestione cicli di cura
- Creazione batch manuale

#### **Implementazione**:
```typescript
// 1. Autoclave Management Service
src/domains/core/services/AutoclaveService.ts
- createAutoclave(data)
- getAutoclavesByDepartment(departmentId)
- createBatch(autoclaveId, odlIds, curingCycleId)

// 2. Autoclave API
src/app/api/autoclaves/route.ts - GET, POST
src/app/api/autoclaves/[id]/route.ts - GET, PUT, DELETE
src/app/api/autoclaves/[id]/batches/route.ts - POST

// 3. Autoclave Management UI
src/app/(dashboard)/production/autoclaves/page.tsx
- Lista autoclavi con specifiche
- Form creazione batch
- Stati batch attuali
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/production/autoclaves`
- ✅ **Test 1**: Visualizza lista autoclavi con dimensioni/capacità
- ✅ **Test 2**: Crea nuovo batch → seleziona ODL compatibili → assegna ciclo cura
- ✅ **Test 3**: Visualizza batch attivi/programmati per autoclave
- ✅ **Test 4**: Modifica stato batch (PLANNED → IN_PROGRESS → COMPLETED)

---

### **STEP 3.2: Algoritmo Ottimizzazione Batch** 
⏱️ **Tempo**: 15-20 ore | 🎯 **Priorità**: CRITICA

#### **Obiettivi**:
- Algoritmo First-Fit Decreasing per ottimizzazione 2D
- Constraint handling (cicli, dimensioni, priorità)
- Visualizzazione layout ottimizzato

#### **Implementazione**:
```typescript
// 1. Optimization Algorithm
src/domains/optimization/algorithms/AutoclaveOptimizer.ts
- optimizeBatch(odlList, autoclave, constraints)
- firstFitDecreasing2D(items, container)
- validateConstraints(batch)
- calculateEfficiency(layout)

// 2. Optimization API
src/app/api/autoclaves/[id]/optimize/route.ts - POST
src/app/api/batches/[id]/layout/route.ts - GET

// 3. 2D Visualization Component
src/components/organisms/AutoclaveLayoutViewer.tsx
- Canvas 2D con ODL posizionati
- Colori per priorità/stato
- Drag-and-drop per aggiustamenti manuali
- Export PDF layout
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/production/autoclaves/optimize`
- ✅ **Test 1**: Seleziona ODL pronti → esegui ottimizzazione → mostra layout 2D
- ✅ **Test 2**: Visualizza efficienza batch (% spazio utilizzato)
- ✅ **Test 3**: Modifica posizioni manualmente → ricalcola efficienza
- ✅ **Test 4**: Export layout PDF per operatori
- ✅ **Test 5**: Performance ottimizzazione <30 secondi per 20+ ODL

---

### **STEP 3.3: Workflow Autoclavi Completo**
⏱️ **Tempo**: 8-10 ore | 🎯 **Priorità**: ALTA  

#### **Obiettivi**:
- Workflow completo: Batch creation → Loading → Curing → Unloading
- Tracking eventi batch con QR scan
- Dashboard controllo autoclavi

#### **Implementazione**:
```typescript
// 1. Autoclave Workflow Service
src/domains/production/services/AutoclaveWorkflowService.ts
- startBatch(batchId, operatorId)
- completeBatch(batchId, operatorId)
- updateBatchProgress(batchId, status)
- trackBatchEvents(batchId, eventType)

// 2. Batch Tracking API
src/app/api/batches/[id]/start/route.ts - POST
src/app/api/batches/[id]/complete/route.ts - POST
src/app/api/batches/[id]/events/route.ts - GET, POST

// 3. Autoclave Control Dashboard
src/components/organisms/AutoclaveControlDashboard.tsx
- Stato real-time tutti gli autoclavi
- Batch in corso con progress
- Timeline prossimi batch
- Alert anomalie
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/production/autoclaves/control`
- ✅ **Test 1**: Avvia batch → ODL passano a IN_AUTOCLAVE → timer ciclo attivo
- ✅ **Test 2**: Dashboard mostra progress batch con tempo rimanente
- ✅ **Test 3**: Completa batch → ODL passano a AUTOCLAVE_COMPLETED
- ✅ **Test 4**: Storico batch con tempi effettivi vs programmati

---

## 📊 **FASE 4: REPORTING E DASHBOARD ADVANCED**

### **STEP 4.1: Dashboard KPI Management**
⏱️ **Tempo**: 10-12 ore | 🎯 **Priorità**: MEDIA

#### **Obiettivi**:
- Dashboard executive con KPI produzione
- Grafici real-time performance
- Alert management avanzato

#### **Implementazione**:
```typescript
// 1. KPI Calculation Service
src/domains/production/services/KPIService.ts
- calculateProductionMetrics(dateRange)
- getAutoclaveEfficiency(period)
- getDepartmentThroughput(departmentId, period)
- generatePerformanceAlerts()

// 2. Dashboard API
src/app/api/dashboard/kpis/route.ts - GET
src/app/api/dashboard/alerts/route.ts - GET

// 3. Executive Dashboard
src/app/(dashboard)/page.tsx (aggiornamento)
- KPI cards con trend
- Grafici performance Recharts
- Alert panel con priorità
- Real-time updates ogni 30 sec
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/` (Dashboard home)
- ✅ **Test 1**: KPI aggiornati in real-time (ODL completati, efficiency, tempi medi)
- ✅ **Test 2**: Grafici mostrano trend ultime 2 settimane
- ✅ **Test 3**: Alert panel mostra anomalie con severità
- ✅ **Test 4**: Click su KPI → drill-down dettaglio report

---

### **STEP 4.2: Sistema Report Completo**
⏱️ **Tempo**: 8-10 ore | 🎯 **Priorità**: MEDIA

#### **Obiettivi**:
- Report produzione configurabili
- Export multipli formati (PDF, Excel, CSV)
- Scheduling report automatici

#### **Implementazione**:
```typescript
// 1. Report Generation Service
src/domains/production/services/ReportService.ts
- generateProductionReport(filters, format)
- generateAutoclaveEfficiencyReport(period)
- generateDepartmentReport(departmentId, period)
- scheduleRecurringReport(config)

// 2. Reports API
src/app/api/reports/production/route.ts - GET
src/app/api/reports/efficiency/route.ts - GET
src/app/api/reports/department/route.ts - GET

// 3. Report Builder UI
src/app/(dashboard)/reports/page.tsx
- Report builder con filtri
- Preview report
- Schedule automatici
- Libreria report salvati
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/reports`
- ✅ **Test 1**: Crea report produzione custom → anteprima → export PDF
- ✅ **Test 2**: Report autoclavi con grafici efficiency per periodo
- ✅ **Test 3**: Schedule report settimanale via email
- ✅ **Test 4**: Libreria report salvati riutilizzabili

---

## 🔄 **FASE 5: INTEGRAZIONE E NOTIFICHE**

### **STEP 5.1: Sistema Notifiche Completo**
⏱️ **Tempo**: 6-8 ore | 🎯 **Priorità**: MEDIA

#### **Obiettivi**:
- Notifiche in-app real-time
- Email notifications per management
- Alert configurabili per soglie

#### **Implementazione**:
```typescript
// 1. Notification Service
src/domains/core/services/NotificationService.ts
- createNotification(type, message, users, priority)
- sendEmailNotification(template, recipients, data)
- processAlertRules(events)

// 2. Notifications API  
src/app/api/notifications/route.ts - GET, POST
src/app/api/notifications/[id]/read/route.ts - PATCH

// 3. Notification System UI
src/components/organisms/NotificationCenter.tsx
- Bell icon con counter
- Dropdown notifiche recenti
- Centro notifiche completo
- Configurazione alert utente
```

#### **Verifica Frontend**:
- ✅ **Pagina**: Tutte (notification center globale)
- ✅ **Test 1**: Alert ritardo ODL → notifica in-app + email responsabile
- ✅ **Test 2**: Batch autoclave completato → notifica operatori
- ✅ **Test 3**: Configurazione soglie alert personalizzate
- ✅ **Test 4**: Centro notifiche con filtri e mark-as-read

---

### **STEP 5.2: Integrazione Gamma MES (Opzionale)**
⏱️ **Tempo**: 10-12 ore | 🎯 **Priorità**: BASSA

#### **Obiettivi**:
- File watcher per export Gamma
- Parser CSV/Excel robusto  
- Sync automatica dati master

#### **Implementazione**:
```typescript
// 1. Gamma Sync Service
src/services/gamma-sync/GammaSyncService.ts
- watchGammaExports()
- parseGammaFile(filePath, type)
- syncPartsData(gammaData)
- syncODLData(gammaData)

// 2. Gamma Sync API
src/app/api/gamma/sync/manual/route.ts - POST
src/app/api/gamma/sync/status/route.ts - GET

// 3. Gamma Sync Dashboard
src/app/(dashboard)/admin/gamma-sync/page.tsx
- Stato sincronizzazione
- Log import con errori
- Configurazione mapping campi
- Sync manuale file
```

#### **Verifica Frontend**:
- ✅ **Pagina**: `/admin/gamma-sync`
- ✅ **Test 1**: Upload file Gamma manuale → parsing → import parti
- ✅ **Test 2**: Monitor sync automatica → log risultati
- ✅ **Test 3**: Gestione errori parsing con dettagli
- ✅ **Test 4**: Configurazione mapping campi Gamma → sistema

---

## 🎯 **TIMELINE E PRIORITÀ**

### **Roadmap Timeline Consigliata**:

| **Settimana** | **Steps** | **Ore** | **Valore Business** |
|---------------|-----------|---------|---------------------|
| **1** | Step 1.1 + 1.2 | 16h | 🟢 QR + Eventi Base |
| **2** | Step 2.1 | 12h | 🟢 Clean Room Workflow |
| **3** | Step 2.2 + 3.1 | 16h | 🟡 Time Tracking + Autoclavi |
| **4** | Step 3.2 | 20h | 🔴 Algoritmo Ottimizzazione |
| **5** | Step 3.3 | 10h | 🟢 Workflow Autoclavi |
| **6** | Step 4.1 + 4.2 | 20h | 🟡 Dashboard + Reports |
| **7** | Step 5.1 | 8h | 🟡 Notifiche |
| **8** | Buffer + Testing | 16h | 🟢 Stabilizzazione |

### **Criteri di Priorità**:
- 🔴 **CRITICA**: Blocca funzionalità downstream
- 🟢 **ALTA**: Valore business immediato
- 🟡 **MEDIA**: Miglioramento UX/reporting
- ⚪ **BASSA**: Nice-to-have

### **Checkpoint di Verifica**:
- ✅ **Fine Settimana 2**: QR + Clean Room funzionanti
- ✅ **Fine Settimana 4**: Algoritmo autoclavi validation
- ✅ **Fine Settimana 6**: Sistema completo testabile
- ✅ **Fine Settimana 8**: Production-ready deployment

---

## 🔄 **Risk Management e Piani di Contingenza**

### **Rischi Identificati**:

#### **1. Algoritmo Autoclavi (Step 3.2) - Rischio ALTO**
- **Problema**: Complessità 2D bin packing sottovalutata
- **Mitigazione**: Buffer settimana 4 dedicato + algoritmo semplificato fallback
- **Piano B**: Posizionamento manuale con suggerimenti automatici

#### **2. Performance Mobile QR Scanner - Rischio MEDIO**
- **Problema**: Lentezza scanning su dispositivi industriali
- **Mitigazione**: Test continui durante Step 1.1, ottimizzazione algoritmi
- **Piano B**: Modalità upload foto QR come alternativa

#### **3. Time Tracking Standards Definition - Rischio MEDIO**
- **Problema**: Definizione tempi standard complessa
- **Mitigazione**: Coinvolgimento stakeholder in Step 2.2, approccio iterativo
- **Piano B**: Sistema configurabile con default generici

### **Buffer Time Allocation**:
- **Step 3.2**: +5 ore buffer per algoritmo complesso
- **Step 2.2**: +3 ore buffer per definizione tempi
- **Settimana 8**: Settimana intera buffer per stabilizzazione

---

## 📋 **Note Implementative**

### **Monitoraggio Tempi**:
Durante **Step 2.2** saranno definiti:
- Schema database per tempi standard per Part Number
- Configurazione soglie alert per ritardi
- Metodologia calcolo tempi commerciali vs effettivi
- Dashboard tempi con trend analysis

### **Mobile-First Approach**:
Tutti i componenti QR e produzione seguono:
- Touch targets 44px minimi
- UI semplificata per ambiente industriale
- Feedback visivo immediato per operatori
- Funzionamento offline-first dove possibile

### **Testing Strategy**:
- **Unit testing**: Services e business logic
- **Integration testing**: API + Database
- **E2E testing**: Workflow completi frontend
- **User testing**: Operatori reali settimana 6

---

## 🚀 **Getting Started**

Per iniziare lo sviluppo seguendo questa roadmap:

1. **Verifica prerequisiti**: Assicurati che l'ambiente di sviluppo sia configurato correttamente
2. **Inizia con Step 1.1**: Sistema QR Code Completo
3. **Verifica frontend**: Completa tutti i test di verifica prima di procedere
4. **Iterazione rapida**: Deploy frequenti per testing immediato
5. **Feedback loop**: Coinvolgi stakeholder per validation continua

Ogni step è indipendente e verificabile, garantendo sviluppo incrementale sicuro e valore business ad ogni iterazione.