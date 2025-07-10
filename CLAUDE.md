# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MES Aerospazio is a Manufacturing Execution System for aerospace component production, specializing in carbon fiber composite manufacturing. The system tracks work orders (ODL) through production departments using QR code scanning and automated batch optimization.

Built as a Next.js 15.3.4 application following Domain-Driven Design principles with Atomic Design System UI components. Uses hybrid architecture: monolithic core with specialized Python microservices for computationally intensive algorithms.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run dev:standard # Start development server without Turbopack (fallback)
npm run dev:clean    # Clean development start using ./start-dev.sh
npm run dev:port     # Development with custom port flag
npm run dev -- -p 3001 # Force specific port (use when multiple Claude instances)
npm run build        # Create production build (does NOT start services)
npm run build:netlify # Specialized Netlify build with database push
npm run start        # Start production server (after build)
npm run lint         # Run ESLint checks
npm run type-check   # Type check without emitting files
```

### Advanced Development Scripts
```bash
./scripts/start.sh                    # Interactive startup menu with options:
                                      # - Development mode (default)
                                      # - Production mode
                                      # - Docker complete setup
                                      # - Services only (DB + Redis)
                                      # - Initial setup
                                      # - Cleanup and status checking

./scripts/dev/start-dev.sh            # Clean development start with port detection
./scripts/dev/test-dashboard.sh       # Dashboard testing with API checks
./scripts/dev/monitor-server.sh       # Server monitoring utilities
```

### Database
```bash
docker compose up -d           # Start PostgreSQL and Redis for development
npm run db:generate            # Generate Prisma client after schema changes
npm run db:push                # Push schema changes to database (development)
npm run db:migrate             # Create and run database migrations (production)
npm run db:migrate:deploy      # Production migration deployment
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed database with initial data
npm run db:seed-complete       # Run complete seed for testing and validation
npm run db:setup-production    # Production database setup
docker compose down            # Stop services
```

### Netlify Database Management
```bash
npm run db:netlify-info        # Access Netlify database information
npm run db:reset-netlify       # Reset Netlify database (shows command)
npm run db:deploy-netlify      # Deploy to Netlify database
./scripts/netlify-db-access.sh # Netlify database access instructions
./scripts/deploy-neon.sh       # Complete deployment to Neon database
```

### Microservices
```bash
# Optimization Service (Python)
cd manta-optimization-service
docker compose -f docker-compose.dev.yml up -d --build  # Start optimization microservice
docker compose -f docker-compose.dev.yml down           # Stop optimization microservice
docker compose -f docker-compose.dev.yml logs           # View microservice logs
curl http://localhost:8000/api/v1/health/               # Test microservice health
pytest                                                  # Run Python tests
pytest --cov=core --cov=api                            # Run tests with coverage
cd ..
```

### Testing Framework
```bash
# Comprehensive Test Suite
node tests/run-all-tests.js     # Run complete test suite with:
                                # - Server health checks
                                # - Authentication testing
                                # - Parts, ODL, Departments API testing
                                # - Production events and workflow testing
                                # - Time metrics testing
                                # - Automatic report generation

# Manual API Testing
curl http://localhost:3000/api/health                   # Check API health
./scripts/dev/test-dashboard.sh                        # Dashboard API checks
```

### Complete Local Setup
```bash
# Interactive Setup (Recommended)
./scripts/start.sh

# Manual Setup
# 1. Start all infrastructure
docker compose up -d
cd manta-optimization-service && docker compose -f docker-compose.dev.yml up -d && cd ..

# 2. Setup database
npm run db:push && npm run db:seed-complete

# 3. Configure environment
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local

# 4. Start Next.js app
npm run dev -- -p 3001

# URLs: 
# - App: http://localhost:3001
# - Microservice: http://localhost:8000
# - Optimization: http://localhost:3001/autoclavi/optimization
# - Login: admin@mantaaero.com / password123
```

### Development Setup (First Time)
```bash
npm install && docker compose up -d && npm run db:push && npm run dev
# Then open http://localhost:3000 and go to /register
```

## Git & Version Control

### Pre-Commit Workflow (OBBLIGATORIO)
```bash
npm run lint && npm run type-check && git add . && git status
```

### Commit Message Standard (Conventional Commits)
```
<type>(<scope>): <description>
```

**Types**: feat, fix, refactor, docs, test, style, chore, perf, security

**Scopes**: auth, qr, odl, production, departments, admin, database, ui, api, workflow

**Examples**:
- `feat(qr): implementa scanning offline con sync automatico`
- `fix(production): corregge calcolo KPI per turnisti Clean Room`
- `refactor(api): migra a service layer pattern per tutti gli endpoint`

### Smart Commit Function
```bash
function smart_commit() {
  npm run lint && npm run type-check && git add . && git commit -m "$1"
}
# Usage: smart_commit "feat(auth): add password reset flow"
```

## Multi-Claude Development

### Port Management
```bash
# Claude Instance 1 (Primary) - Porta 3000
npm run dev

# Claude Instance 2 (Secondary) - Porta 3001  
npm run dev -- -p 3001

# Check ports in use
ss -tlnp | grep :300[0-9]

# Clean cache on conflicts
rm -rf .next && npm run dev
```

### Best Practices Multi-Claude
- ✅ **Sempre specifica porta**: `npm run dev -- -p 300X`
- ✅ **Controlla stato prima**: `ss -tlnp | grep :300[0-9]`
- ✅ **Usa Ctrl+C per terminare**: mai `kill -9`
- ✅ **Coordina modifiche database**: una sola istanza per migrations

## Architecture & Tech Stack

### Core Technologies
- **Next.js 15.3.4** (App Router) with Turbopack
- **React 19.0.0** with TypeScript 5.x strict mode
- **Material-UI v7** with Emotion styling
- **NextAuth.js v5** with Prisma adapter, JWT sessions, role-based access
- **Prisma ORM 6.x** with PostgreSQL database
- **Zod validation** schemas for runtime type safety
- **QR Code**: @zxing/browser + qrcode generation for offline-capable scanning

### Architecture Patterns
- **Hybrid Architecture**: Next.js monolithic core + Python microservices for algorithms
- **Domain-Driven Design**: Organized by business domains (production, planning, quality)
- **Atomic Design**: UI components hierarchy (atoms → molecules → organisms → templates)
- **Type Safety**: End-to-end TypeScript with runtime validation via Zod

### Project Structure
```
src/
├── app/                    # Next.js App Router with route groups
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application dashboard
│   ├── api/               # API routes (auth, admin, ODL, production, workflow)
│   └── layout.tsx         # Root layout with providers
├── components/            # Atomic Design System (atoms, molecules, organisms, templates)
├── domains/               # DDD business domains (core, production, user, optimization)
├── lib/                   # Core infrastructure (auth, prisma, theme, email-service)
├── services/              # API and external services
├── utils/                 # Business utilities (constants, helpers, QR parsing)
└── middleware.ts          # Route protection with NextAuth
```

## Business Context

### Core Functionality
- **ODL (Work Orders)**: Track aerospace parts through production departments
- **QR Code System**: Generate unique codes for ODL tracking, scan for department entry/exit
- **Production Flow**: Clean Room (Lamination) → Autoclavi (Curing) → NDI → Rifilatura
- **Automatic Workflow**: Department-to-department ODL transfer system with validation
- **Offline Capability**: QR scanner works offline with automatic sync when connection restored

### Key Business Rules
- **ODL Format**: Unique alphanumeric Part Numbers (format: 8G5350A0...)
- **Production Shifts**: Standard 6-14, 14-22 with shift supervisor tracking
- **Mobile-First Design**: Operators use smartphones for QR scanning in industrial environment
- **Aerospace Compliance**: All production events tracked for audit trails and quality standards
- **Italian Business Context**: UI in Italian, follows Italian manufacturing conventions

## Critical Implementation Details

### Authentication Architecture
- **NextAuth v5** with custom Credentials provider (`src/lib/auth.ts`)
- **Multi-level Role System**: Global roles (ADMIN, SUPERVISOR, OPERATOR) + Department roles (CAPO_REPARTO, CAPO_TURNO, OPERATORE)
- **Route Protection**: All routes protected by default via `middleware.ts`, except auth pages
- **Session Management**: JWT tokens with user ID, role, and department embedded
- **Complete Password Management**: Registration, login, change, forgot/reset flow

### Database Architecture
- **Comprehensive Prisma schema**: 19 tables with complete domain model
- **Core Entities**: Part, ODL, Department, Tool with master data management
- **Production Tracking**: ProductionEvent for audit trail, AutoclaveLoad for batch optimization
- **Department Extensions**: Optional department-specific configurations (PartNDI, PartAutoclave, PartCleanroom)
- **Performance Indexes**: Optimized queries for production workloads

### Service Layer Architecture (CRITICAL)
- **All services are STATIC**: Services in `src/domains/*/services/` use static methods only
- **Example**: `PartService.findMany()` NOT `new PartService().findMany()`
- **Pattern**: `export class ServiceName { static async methodName() {} }`
- **Common Error**: Using instance methods breaks API routes with "is not a function" errors

## Standardizzazione e Centralizzazione Gestione Dati

### API Response Format Standard (OBBLIGATORIO)
Tutti gli endpoint API devono utilizzare il formato di risposta unificato tramite `ResponseHelper`:

```typescript
// GET /api/entity - Lista paginata
return ResponseHelper.paginated(
  data,
  total,
  page,
  limit
)

// POST /api/entity - Risorsa creata
return ResponseHelper.created(data)

// GET /api/entity/[id] - Risorsa singola
return ResponseHelper.success(data)

// Errori standardizzati
return ResponseHelper.unauthorized()
return ResponseHelper.forbidden()
return ResponseHelper.notFound()
return ResponseHelper.conflict()
return ResponseHelper.validationError(message, details)
```

### Service Layer Pattern (OBBLIGATORIO)
Tutti gli endpoint API devono utilizzare il Service Layer, mai accesso diretto a Prisma:

```typescript
// ✅ CORRETTO - Usa Service Layer
export const GET = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return ResponseHelper.unauthorized()
  }

  const queryParams = QueryHelper.parseSearchParams(request.url)
  const validatedQuery = entityQuerySchema.parse(queryParams)
  const result = await EntityService.findMany(validatedQuery)

  return ResponseHelper.paginated(
    result.entities,
    result.total,
    result.page,
    result.limit
  )
})

// ❌ SBAGLIATO - Accesso diretto Prisma
const entities = await prisma.entity.findMany({...})
```

### Error Handling Centralizzato (OBBLIGATORIO)
```typescript
// Wrap tutti gli handler con ErrorHelper
export const GET = ErrorHelper.withErrorHandling(async (request: NextRequest) => {
  // Logica endpoint
})

// Custom error types
throw new ConflictError('Risorsa già esistente')
throw new NotFoundError('Risorsa non trovata')
throw new ValidationError('Dati non validi', zodErrors)
```

### Auth Pattern Standard (OBBLIGATORIO)
```typescript
// Verifica autenticazione
const session = await auth()
if (!session?.user) {
  return ResponseHelper.unauthorized()
}

// Verifica permessi
if (!AuthHelper.canModify(session.user.role)) {
  return ResponseHelper.forbidden()
}

// Verifica admin
if (!AuthHelper.isAdmin(session.user.role)) {
  return ResponseHelper.forbidden()
}
```

### Race Condition Protection (CRITICO)
Per operazioni concorrenti, utilizzare sempre il pattern retry con lock ottimistico:

```typescript
// WorkflowService pattern per operazioni atomiche
const result = await this.executeWithRetry(async () => {
  return await prisma.$transaction(async (tx) => {
    // Operazione atomica con verifica stato
    const updated = await tx.entity.update({
      where: { 
        id: entityId,
        status: expectedStatus // Lock ottimistico
      },
      data: { status: newStatus }
    })
    
    if (!updated) {
      throw new Error('Stato modificato durante operazione')
    }
    
    // Altre operazioni correlate
    return updated
  }, {
    maxWait: 10000,
    timeout: 30000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  })
})
```

### Service Layer Standard Pattern (OBBLIGATORIO)
```typescript
// Tutti i servizi devono implementare questo pattern
export class EntityService {
  static async findMany(input: EntityQueryInput) {
    // Validazione input
    // Query ottimizzata con paginazione
    // Trasformazione dati
    return { entities, total, page, limit, totalPages }
  }
  
  static async create(input: CreateEntityInput) {
    // Validazione business rules
    // Operazioni atomiche in transazione
    // Gestione associazioni
    return entity
  }
  
  static async update(id: string, input: UpdateEntityInput) {
    // Verifica esistenza
    // Validazione unicità
    // Operazioni atomiche
    return entity
  }
  
  static async delete(id: string) {
    // Verifica esistenza
    // Controllo dipendenze
    // Eliminazione sicura
    return void
  }
}
```

### Material-UI Grid v7 Breaking Changes (IMPORTANT)
- **DEPRECATO**: `<Grid item xs={12} sm={6} md={4}>` sintassi NON supportata
- **CORRETTO**: `<Grid size={{ xs: 12, sm: 6, md: 4 }}>` nuova sintassi obbligatoria
- **Container**: `<Grid container spacing={3}>` rimane invariato
- **TypeScript Error**: Compilation fails if old syntax is used

### Seed Management & Testing Protocol
- **Complete Seed File**: `prisma/seed-complete.ts` contains comprehensive test data for all domains
- **IMPORTANTE**: Seed files sono SOLO per sviluppo locale, NON vengono utilizzati in produzione/Netlify
- **When to Update Seed**: Every time new features/entities are added, update the seed file accordingly  
- **Test Credentials** (solo sviluppo locale): 
  - Admin: `admin@mantaaero.com / password123`
  - Supervisor: `capo.cleanroom@mantaaero.com / password123`
  - Operator: `op1.cleanroom@mantaaero.com / password123`

## Development Workflow

### Pre-Commit Workflow (OBBLIGATORIO)
```bash
npm run lint && npm run type-check
```

### Database Development
- **Schema Changes**: `npm run db:generate` → `npm run db:push` for development
- **Testing Data**: **SEMPRE** `npm run db:seed-complete` dopo nuove features (SOLO sviluppo locale)
- **Production Migrations**: `npm run db:migrate` for production-ready migrations
- **IMPORTANTE**: NO seeding in produzione - database Netlify rimane vuoto per dati reali

### Schema Validation & Field Removal (CRITICAL)
**PRIMA di rimuovere/modificare campi dal codice, SEMPRE verificare:**
```bash
# 1. Verificare se il campo è usato nel codebase
grep -r "nomeCampo" src/
# 2. Verificare se esiste nel schema Prisma
grep -A 10 "model NomeModello" prisma/schema.prisma
```

**Approccio corretto per errori di campo mancante:**
1. ✅ **Verificare uso**: Se il campo è usato in frontend/API
2. ✅ **Schema check**: Controllare se esiste in `prisma/schema.prisma`
3. ✅ **Se campo mancante ma usato**: Aggiungere al schema o implementare logica alternativa
4. ❌ **MAI rimuovere senza verifica**: Può rompere funzionalità esistenti

**Esempi comuni:**
- `progressivo` → mappare a `odlNumber` per compatibilità API
- `description` → usare campo alternativo se manca (es. `name`)
- `currentDepartmentId` → derivare da `ProductionEvent` se mancante

### Component Development Standards
- **Atomic Design**: SEMPRE seguire pattern atoms → molecules → organisms → templates
- **Material-UI v7**: Usare SOLO sintassi `<Grid size={{ xs: 12, sm: 6 }}>` - old syntax deprecata
- **Mobile-First**: Tutti componenti 44px minimum touch targets per smartphone industriale
- **Type Safety**: Zod schemas obbligatori per tutti i domini, TypeScript strict mode

## Production Readiness
```bash
npm run build && npm run lint && npm run type-check
```

## Next Development Priorities
1. **Admin Pages**: Complete `/admin/departments`, `/admin/settings` implementation
2. **Advanced Production**: NDI module, detailed reporting systems
3. **Department Management**: Pages for department heads and shift supervisors
4. **Python Microservices**: Optimization algorithms for autoclave nesting (2D bin packing)

## Schema Relazionale e Gerarchia Dati (IMPORTANTE)

### Principio Chiave: Part Number come Fonte di Verità
- **Chiave Primaria**: Il `partNumber` è la chiave primaria del business domain
- **Gerarchia Dati**: `ODL` → `Part` → Configurazioni Reparto-Specifiche
- **Eliminazione Ridondanza**: Rimossi `curingCycleId`, `vacuumLines`, `length`, `width`, `height` dal modello ODL

### Architettura DDD Part - Solo Tabelle di Estensione (AGGIORNAMENTO CRITICO)

⚠️ **IMPORTANTE**: I campi `defaultCuringCycleId`, `defaultVacuumLines`, `standardLength`, `standardWidth`, `standardHeight` sono stati **RIMOSSI DEFINITIVAMENTE** dal modello Part per seguire l'architettura DDD.

#### Modello Part Pulito
```prisma
model Part {
  id           String   @id @default(cuid())
  partNumber   String   @unique
  description  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Solo configurazioni tramite tabelle di estensione
  autoclaveConfig  PartAutoclave?  @relation("PartAutoclaveConfig")
  cleanroomConfig  PartCleanroom?  @relation("PartCleanroomConfig") 
  ndiConfig        PartNDI?        @relation("PartNDIConfig")
  partTools        PartTool[]      // Dimensioni via Tool
}
```

#### Flusso Dati Corretto (AGGIORNATO)
```
ODL.partId → Part.partNumber → PartAutoclave.{curingCycleId, vacuumLines, setupTime}
                              → PartCleanroom.{layupSequence, resinType, cycleTime}
                              → PartNDI.{inspectionMethod, acceptanceCriteria}
                              → PartTool.{toolId} → Tool.{base, height, weight}
```

#### Accesso ai Dati di Configurazione (NUOVO PATTERN)
```typescript
// ✅ CORRETTO - Usa tabelle di estensione
const cycleId = odl.part.autoclaveConfig?.curingCycleId;
const vacuumLines = odl.part.autoclaveConfig?.vacuumLines;
const dimensions = {
  length: odl.part.partTools?.[0]?.tool?.base,
  width: odl.part.partTools?.[0]?.tool?.base,  // Tool ha solo base e height
  height: odl.part.partTools?.[0]?.tool?.height,
};

// ❌ SBAGLIATO - Campi rimossi dal modello Part
const cycleId = odl.part.defaultCuringCycleId;  // NON ESISTE PIÙ
const vacuumLines = odl.part.defaultVacuumLines; // NON ESISTE PIÙ
const length = odl.part.standardLength;          // NON ESISTE PIÙ
```

#### Pattern di Query con Include Obbligatorio
```typescript
// ✅ CORRETTO - Include configurazioni necessarie
const odls = await prisma.oDL.findMany({
  include: {
    part: {
      include: {
        autoclaveConfig: {
          include: { curingCycle: true }
        },
        partTools: {
          include: { tool: true }
        }
      }
    }
  }
});

// ❌ SBAGLIATO - Missing include causa errori
const odls = await prisma.oDL.findMany({
  include: { part: true } // Configurazioni non incluse
});
```

#### Migrazione Completata
- ✅ Database: Campi rimossi dal schema Part
- ✅ Service Layer: Usa solo tabelle di estensione  
- ✅ API Routes: Include configurazioni via relazioni
- ✅ Frontend: Accesso tramite configurazioni estese

#### Schema Input Part - Nomenclatura Corretta (CRITICO)

⚠️ **ATTENZIONE**: I nomi dei campi input sono stati standardizzati per evitare confusione con i campi rimossi dal database:

```typescript
// ✅ SCHEMA INPUT CORRETTO (part.schema.ts)
export const createPartSchema = z.object({
  partNumber: z.string().min(1),
  description: z.string().min(1),
  
  // Configurazioni Autoclavi - nomi SENZA "default"
  curingCycleId: z.string().optional(),        // NON defaultCuringCycleId
  vacuumLines: z.number().optional(),          // NON defaultVacuumLines  
  autoclaveSetupTime: z.number().optional(),
  autoclaveLoadPosition: z.string().optional(),
  
  // Configurazioni Clean Room
  resinType: z.string().optional(),
  prepregCode: z.string().optional(), 
  cycleTime: z.number().optional(),
  roomTemperature: z.number().optional(),
  
  // Configurazioni NDI
  inspectionTime: z.number().optional(),
  calibrationReq: z.string().optional(),
})

// ❌ NOMI DEPRECATI - NON USARE MAI
// defaultCuringCycleId → curingCycleId
// defaultVacuumLines → vacuumLines
```

#### Pattern Service Layer - Gestione Configurazioni (OBBLIGATORIO)

```typescript
// ✅ PATTERN CORRETTO - PartService.create()
static async create(input: CreatePartInput): Promise<Part> {
  return await prisma.$transaction(async (tx) => {
    // 1. Crea Part base (solo partNumber + description)
    const part = await tx.part.create({
      data: {
        partNumber: input.partNumber,
        description: input.description,
      }
    })

    // 2. Crea configurazioni estensione se fornite
    if (input.curingCycleId || input.vacuumLines || ...) {
      await tx.partAutoclave.create({
        data: {
          partId: part.id,
          curingCycleId: input.curingCycleId,    // Input → Extension Table
          vacuumLines: input.vacuumLines || 1,   // Input → Extension Table
          setupTime: input.autoclaveSetupTime,
          loadPosition: input.autoclaveLoadPosition,
        }
      })
    }
    
    // 3. Ripeti per PartCleanroom, PartNDI...
    return Part.fromPrisma(part)
  })
}
```

#### Regole di Validazione Form (CRITICO)

```typescript
// ✅ FORM CONFIGURATION CORRETTA
const autoclaveFields: FieldConfig[] = [
  {
    name: 'curingCycleId',           // NON defaultCuringCycleId
    label: 'Ciclo di Cura',
    type: 'select',
    options: curingCycles
  },
  {
    name: 'vacuumLines',             // NON defaultVacuumLines  
    label: 'Linee Vacuum',
    type: 'number',
    placeholder: '1-10 linee'
  }
]

// ✅ FORM DEFAULT VALUES CORRETTI
defaultValues: {
  partNumber: '',
  description: '',
  curingCycleId: '',               // NON defaultCuringCycleId
  vacuumLines: undefined,          // NON defaultVacuumLines
  // ... altri campi configurazione
}
```

#### Errori Comuni da Evitare (IMPORTANTE)

1. **❌ Non usare mai campi "default*" nell'input**:
   ```typescript
   // SBAGLIATO
   defaultCuringCycleId: z.string().optional()
   defaultVacuumLines: z.number().optional()
   
   // CORRETTO  
   curingCycleId: z.string().optional()
   vacuumLines: z.number().optional()
   ```

2. **❌ Non accedere mai ai campi rimossi**:
   ```typescript
   // SBAGLIATO
   const cycleId = odl.part.defaultCuringCycleId
   const lines = odl.part.defaultVacuumLines
   
   // CORRETTO
   const cycleId = odl.part.autoclaveConfig?.curingCycleId
   const lines = odl.part.autoclaveConfig?.vacuumLines
   ```

3. **❌ Non dimenticare mai gli include per le configurazioni**:
   ```typescript
   // SBAGLIATO - Missing configurations
   const parts = await prisma.part.findMany()
   
   // CORRETTO - Include configurations  
   const parts = await prisma.part.findMany({
     include: {
       autoclaveConfig: true,
       cleanroomConfig: true,
       ndiConfig: true,
       partTools: { include: { tool: true } }
     }
   })
   ```

## Defensive Programming Standards (CRITICO)

### Null/Undefined Safety Pattern (OBBLIGATORIO)
**Sempre applicare defensive programming per evitare errori runtime**

#### Array e Object Props - Pattern Sicuro
```typescript
// ✅ CORRETTO - Defensive checks for array/object props
{breadcrumbs && breadcrumbs.length > 0 && (
  <Breadcrumbs>
    {breadcrumbs.map((crumb, index) => (
      <Link key={index}>
        {crumb.label}
      </Link>
    ))}
  </Breadcrumbs>
)}

// ✅ CORRETTO - Safe length access
const currentTotalCount = enableServerPagination ? 
  (totalCount ?? (data?.length ?? 0)) : 
  (data?.length ?? 0)

// ✅ CORRETTO - Safe data prop passing
<DataTable
  data={data ?? []}
  columns={enhancedColumns}
  // ... altri props
/>

// ✅ CORRETTO - Safe empty state check
{!loading && (data?.length ?? 0) === 0 && (
  <EmptyState />
)}
```

#### Foreign Key Constraint Management (CRITICO)
**Sempre gestire le constraint di foreign key prima delle operazioni di delete**

```typescript
// ✅ PATTERN CORRETTO - Delete con cascade handling
static async delete(id: string): Promise<void> {
  // 1. Verificare dipendenze che impediscono la cancellazione
  const dependencyCount = await prisma.dependency.count({
    where: { parentId: id }
  })
  
  if (dependencyCount > 0) {
    throw new Error(`Cannot delete record with ${dependencyCount} dependencies`)
  }
  
  // 2. Eliminare in transazione le relazioni cascade
  await prisma.$transaction(async (tx) => {
    // Prima eliminare le relazioni
    await tx.relatedTable.deleteMany({ where: { parentId: id } })
    
    // Poi eliminare il record principale
    await tx.mainTable.delete({ where: { id } })
  })
}
```

#### Service Layer - Error Handling Pattern (OBBLIGATORIO)
```typescript
// ✅ PATTERN CORRETTO - Controllo completo dipendenze
static async delete(id: string): Promise<void> {
  // Verificare TUTTE le foreign key constraints
  const [dep1Count, dep2Count, dep3Count] = await Promise.all([
    prisma.dependency1.count({ where: { parentId: id } }),
    prisma.dependency2.count({ where: { parentId: id } }),
    prisma.dependency3.count({ where: { parentId: id } })
  ])
  
  if (dep1Count > 0) {
    throw new Error(`Cannot delete: ${dep1Count} related records exist`)
  }
  
  // Eliminazione sicura in transazione
  await prisma.$transaction(async (tx) => {
    // Eliminare tutte le configurazioni correlate
    await tx.extensionTable1.deleteMany({ where: { parentId: id } })
    await tx.extensionTable2.deleteMany({ where: { parentId: id } })
    
    // Eliminare il record principale
    await tx.mainTable.delete({ where: { id } })
  })
}
```

#### Common Error Patterns da Evitare
1. **❌ Non verificare mai null/undefined**:
   ```typescript
   // SBAGLIATO
   {breadcrumbs.length > 0 && ...}
   const total = data.length
   
   // CORRETTO
   {breadcrumbs && breadcrumbs.length > 0 && ...}
   const total = data?.length ?? 0
   ```

2. **❌ Delete senza controllo constraint**:
   ```typescript
   // SBAGLIATO
   await prisma.entity.delete({ where: { id } })
   
   // CORRETTO
   await prisma.$transaction(async (tx) => {
     await tx.relatedConfigs.deleteMany({ where: { entityId: id } })
     await tx.entity.delete({ where: { id } })
   })
   ```

3. **❌ Assumere che i props siano sempre definiti**:
   ```typescript
   // SBAGLIATO
   data.map(item => ...)
   
   // CORRETTO
   (data ?? []).map(item => ...)
   ```

### Checklist Pre-Commit (AGGIORNATA)
```bash
# Verifica defensive programming
grep -r "\.length" src/components/ | grep -v "?\.length"  # Trova accessi non sicuri
grep -r "\.delete(" src/domains/ | grep -v "transaction"  # Trova delete senza transazione

# Test dei controlli
npm run lint && npm run type-check
```

## Memories
- **Rispondi in italiano**: Indicates a preference for Italian language interactions when possible
- **Project Documentation**: Aggiorna i requisiti e i documenti quando vengono definite nuove funzionalità