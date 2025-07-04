# Piano di Sviluppo Reparto Autoclave

## Panoramica
Questo documento definisce il piano di implementazione completo per il reparto Autoclave del sistema MES Aerospazio. Il reparto gestisce il processo di cura in autoclave dei componenti in fibra di carbonio, con tracking completo dei batch, cicli di cura e avanzamento ODL.

## 1. Architettura Database

### 1.1 Tabella di Estensione PartAutoclave
```prisma
model PartAutoclave {
  id                String        @id @default(cuid())
  partId            String        @unique
  
  // Ciclo di cura richiesto per questo part number
  curingCycleId     String        // Ciclo cura obbligatorio
  
  // Configurazione valvole vuoto
  vacuumValves      Int           @default(1)    // Numero valvole richieste
  
  // Parametri ottimizzazione futura
  nestingPriority   Int           @default(1)    // Priorità in batch
  canRotate         Boolean       @default(true) // Rotazione permessa
  canStack          Boolean       @default(false)// Impilabile
  maxStackHeight    Int           @default(1)    // Altezza max stack
  
  // Vincoli produzione
  minBatchSize      Int           @default(1)    // Min pezzi per batch
  maxBatchSize      Int?                         // Max pezzi per batch
  
  // Timing processo
  setupTime         Int           @default(30)   // Tempo setup minuti
  cooldownTime      Int           @default(60)   // Raffreddamento minuti
  
  // Relations
  part              Part          @relation(fields: [partId], references: [id])
  curingCycle       CuringCycle   @relation(fields: [curingCycleId], references: [id])
  
  @@index([partId])
  @@index([curingCycleId])
  @@map("part_autoclave")
}
```

### 1.2 Aggiornamenti Tabella AutoclaveLoad
```prisma
// Aggiungere a model AutoclaveLoad:

// Tracking operatori
loadedBy          String?       // User che ha caricato fisicamente
startedBy         String?       // User che ha avviato ciclo
completedBy       String?       // User che ha completato ciclo

// Relations
loader            User?         @relation("LoadLoader", fields: [loadedBy], references: [id])
starter           User?         @relation("LoadStarter", fields: [startedBy], references: [id])
completer         User?         @relation("LoadCompleter", fields: [completedBy], references: [id])
```

### 1.3 Relazioni e Logica Cicli di Cura
- `PartAutoclave.curingCycleId` → ciclo cura RICHIESTO per il part number nel reparto autoclave
- `Part.defaultCuringCycleId` → DA RIMUOVERE (sostituito da PartAutoclave)
- `Part.partTools` → utensili associati
- `ODL.curingCycleId` → DA RIMUOVERE (usa sempre PartAutoclave.curingCycleId)
- `AutoclaveLoad.curingCycleId` → ciclo utilizzato nel batch (preso da PartAutoclave)

## 2. Implementazione Pagine

### 2.1 /dashboard/autoclave/machines
**Funzionalità:**
- Lista autoclavi con filtri e ordinamento
- Visualizzazione stato (AVAILABLE, IN_USE, MAINTENANCE)
- CRUD completo (create, read, update, delete)
- Soft delete con flag isActive

**Componenti UI:**
```typescript
// src/components/templates/autoclave/AutoclaveMachineList.tsx
- DataGrid con colonne: Code, Name, Dimensions, Status, VacuumLines, Actions
- Filtri: Status, IsActive
- Azioni: Edit, Toggle Active, View Details

// src/components/molecules/autoclave/AutoclaveMachineForm.tsx
- Form fields: code, name, maxLength, maxWidth, maxHeight, vacuumLines
- Validazione Zod schema
- Mode: create/edit
```

### 2.2 /dashboard/autoclave/cycles
**Funzionalità:**
- Lista cicli di cura con dettagli fasi
- CRUD completo cicli
- Visualizzazione parti associate
- Soft delete con flag isActive

**Componenti UI:**
```typescript
// src/components/templates/autoclave/CuringCycleList.tsx
- DataGrid con colonne: Code, Name, Phase1, Phase2, PartsCount, Actions
- Espansione riga per dettagli completi
- Filtri: IsActive, HasPhase2

// src/components/molecules/autoclave/CuringCycleForm.tsx
- Sezioni: Base Info, Phase 1 (required), Phase 2 (optional)
- Validazione temperature/pressioni tecnicamente valide
- Preview durata totale ciclo
```

### 2.3 /dashboard/autoclave/create-batch
**Funzionalità:**
- Selezione ODL disponibili (stato CLEANROOM_COMPLETED)
- Filtro per ciclo cura compatibile
- Assegnazione autoclave disponibile
- Creazione batch e avanzamento ODL

**Componenti UI:**
```typescript
// src/components/templates/autoclave/CreateBatchWizard.tsx
- Step 1: Selezione ciclo cura
- Step 2: Selezione ODL compatibili
- Step 3: Assegnazione autoclave e scheduling
- Step 4: Riepilogo e conferma

// src/components/organisms/autoclave/ODLSelector.tsx
- Lista ODL con checkbox multipla
- Filtri: PartNumber, Priority, CuringCycle
- Info: quantity, dimensions, valves required

// src/components/molecules/autoclave/BatchSummary.tsx
- Riepilogo ODL selezionati
- Totale pezzi, valvole richieste
- Durata ciclo prevista
```

### 2.4 /dashboard/autoclave/settings
**Funzionalità:**
- Hub navigazione impostazioni reparto
- Tab per sezioni diverse
- Link a pagine dedicate

**Layout:**
```
Settings Autoclave
├── Tab: Autoclavi → link to /machines
├── Tab: Cicli di Cura → link to /cycles
├── Tab: Configurazione → parametri generali reparto
└── Tab: Report → statistiche e KPI
```

## 3. API Endpoints

### 3.1 Autoclavi
```typescript
// GET /api/autoclave/machines
// POST /api/autoclave/machines
// GET /api/autoclave/machines/[id]
// PUT /api/autoclave/machines/[id]
// DELETE /api/autoclave/machines/[id]

interface AutoclaveResponse {
  id: string
  code: string
  name: string
  maxLength: number
  maxWidth: number
  maxHeight: number
  vacuumLines: number
  isActive: boolean
  currentLoad?: AutoclaveLoadSummary
}
```

### 3.2 Cicli di Cura
```typescript
// GET /api/autoclave/cycles
// POST /api/autoclave/cycles
// GET /api/autoclave/cycles/[id]
// PUT /api/autoclave/cycles/[id]
// DELETE /api/autoclave/cycles/[id]

interface CuringCycleResponse {
  id: string
  code: string
  name: string
  phase1: PhaseData
  phase2?: PhaseData
  totalDuration: number
  partsCount: number
}
```

### 3.3 Batch Management
```typescript
// GET /api/autoclave/odl/available
// POST /api/autoclave/batch
// GET /api/autoclave/batch/[id]
// PUT /api/autoclave/batch/[id]/status
// POST /api/autoclave/batch/[id]/cancel

interface CreateBatchRequest {
  autoclaveId: string
  curingCycleId: string
  odlIds: string[]
  plannedStart: Date
}
```

## 4. Business Logic

### 4.1 Validazioni Creazione Batch
```typescript
// BatchValidationService
validateBatch(odls: ODL[], curingCycle: CuringCycle): ValidationResult {
  // 1. Verifica tutti ODL stesso ciclo cura
  // 2. Verifica stato ODL = CLEANROOM_COMPLETED
  // 3. Verifica totale valvole <= autoclave.vacuumLines
  // 4. Verifica nessun ODL già in altro batch attivo
}
```

### 4.2 Gestione Stati
```typescript
// BatchStateManager
class BatchStateManager {
  // Transizioni batch
  static async transitionBatch(batch: AutoclaveLoad, newStatus: LoadStatus) {
    // DRAFT → READY: validazioni complete
    // READY → IN_CURE: avvia ciclo, ODL → IN_AUTOCLAVE
    // IN_CURE → COMPLETED: fine ciclo
    // COMPLETED → RELEASED: ODL → AUTOCLAVE_COMPLETED → workflow
    // Any → CANCELLED: rollback ODL a previousStatus
  }
}
```

### 4.3 Workflow Automatico
```typescript
// AutoclaveWorkflowService
async handleBatchRelease(batchId: string) {
  // 1. Get all ODL in batch
  // 2. For each ODL:
  //    - Set status = AUTOCLAVE_COMPLETED
  //    - Create EXIT event
  //    - Determine next department (usually NDI)
  //    - Create ENTRY event in next department
  //    - Update ODL status to next department
}
```

## 5. Seed Data

### 5.1 Autoclavi
```typescript
const autoclaves = [
  { code: "AC001", name: "Autoclave 1", maxLength: 6000, maxWidth: 2000, maxHeight: 2000, vacuumLines: 12 },
  { code: "AC002", name: "Autoclave 2", maxLength: 4000, maxWidth: 1500, maxHeight: 1500, vacuumLines: 8 },
  { code: "AC003", name: "Autoclave 3 - Large", maxLength: 8000, maxWidth: 2500, maxHeight: 2500, vacuumLines: 16 },
]
```

### 5.2 Cicli di Cura
```typescript
const curingCycles = [
  { 
    code: "CC180-01", 
    name: "Standard 180°C Single",
    phase1: { temperature: 180, pressure: 7, duration: 120 }
  },
  { 
    code: "CC180-02", 
    name: "Standard 180°C Double", 
    phase1: { temperature: 135, pressure: 3, duration: 60 },
    phase2: { temperature: 180, pressure: 7, duration: 120 }
  },
  // Altri cicli standard aerospaziali...
]
```

### 5.3 Configurazioni PartAutoclave
```typescript
// Per ogni part esistente, creare config autoclave
const partAutoclaveConfigs = parts.map((part, index) => ({
  partId: part.id,
  curingCycleId: curingCycles[index % curingCycles.length].id, // Assegna cicli in modo circolare
  vacuumValves: Math.floor(Math.random() * 3) + 1, // 1-3 valvole
  nestingPriority: 1,
  setupTime: 30,
  cooldownTime: 60
}))
```

## 6. Testing Strategy

### 6.1 Unit Tests
- Validazione batch creation rules
- State transition logic
- Workflow automation

### 6.2 Integration Tests
- API endpoints con database
- Transazioni complesse (create batch + update ODL)
- Rollback scenarios

### 6.3 E2E Tests
- Flow completo: create batch → start → complete → release
- Gestione errori e rollback
- Multi-user scenarios

## 7. Deployment Steps

1. **Database Migration**
   - Add PartAutoclave table
   - Update AutoclaveLoad with operator tracking
   - Run seed for test data

2. **Backend Implementation**
   - Services layer (static methods)
   - API routes
   - Validation logic

3. **Frontend Implementation**
   - Atomic components
   - Page templates
   - Integration with API

4. **Testing & Validation**
   - Run full test suite
   - Manual QA testing
   - Performance validation

5. **Documentation**
   - Update API docs
   - User guide for operators
   - Admin configuration guide

## 8. Future Enhancements

1. **Ottimizzazione 2D Bin Packing**
   - Algoritmo Python microservice
   - Visualizzazione layout grafico
   - Massimizzazione utilizzo spazio

2. **Tracking Parametri Reali**
   - Integrazione PLC/SCADA
   - Grafici temperatura/pressione
   - Allarmi real-time

3. **Gestione Avanzata Valvole**
   - Inventory valvole
   - Manutenzione programmata
   - Tracking utilizzo

4. **Analytics e KPI**
   - Utilizzo autoclavi
   - Efficienza batch
   - Tempi ciclo medi

## Note Implementative

- Seguire pattern Domain-Driven Design esistente
- Utilizzare Atomic Design System per UI
- Mantenere consistenza con altri reparti
- Priorità su usabilità mobile per operatori
- Validazioni stringenti per sicurezza processo