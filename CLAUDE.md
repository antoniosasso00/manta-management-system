# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MES Aerospazio is a Manufacturing Execution System for aerospace component production, specializing in carbon fiber composite manufacturing. The system tracks work orders (ODL) through production departments including Clean Room (lamination) and Autoclaves (curing cycles) using QR code scanning and automated batch optimization.

Built as a Next.js 15.3.4 application following Domain-Driven Design principles with Atomic Design System UI components. Uses hybrid architecture: monolithic core with specialized Python microservices for computationally intensive algorithms.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run dev:standard # Start development server without Turbopack (fallback)
npm run dev -- -p 3001 # Force specific port (use when multiple Claude instances)
npm run build        # Create production build  
npm run start        # Start production server
npm run lint         # Run ESLint checks
npx tsc --noEmit     # Type check without emitting files
```

### Git & Commit Automation
```bash
# Pre-commit checks (run before every commit)
npm run lint && npx tsc --noEmit   # Quality checks
git add . && git status            # Stage and review changes

# Smart commit with automated checks
function smart_commit() {
  npm run lint && npx tsc --noEmit && git add . && git commit -m "$1"
}

# Usage: smart_commit "feat(auth): add password reset flow"
# Format: type(scope): description
# Types: feat, fix, refactor, docs, test, style, chore, perf, security
```

### Database
```bash
docker compose up -d           # Start PostgreSQL and Redis for development
npm run db:generate            # Generate Prisma client after schema changes
npm run db:push                # Push schema changes to database (development)
npm run db:migrate             # Create and run database migrations (production)
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed database with initial data
npm run db:seed-complete       # Run complete seed for testing and validation
docker compose down            # Stop services
docker compose logs postgres   # View database logs
docker compose ps              # Check container status
docker compose restart postgres # Restart database container
```

### Development Setup (First Time)
```bash
npm install                    # Install dependencies
docker compose up -d           # Start PostgreSQL and Redis
npm run db:push                # Setup database schema
npm run dev                    # Start development server
# Visit http://localhost:3000/register to create first user
```

### Quick Start (Single Command)
```bash
docker compose up -d && npm run db:push && npm run dev
# Then open http://localhost:3000 and go to /register
```

## Git & Version Control

### Commit Best Practices & Automated Workflow

Per mantenere uno storico Git pulito e professionale, seguire questo workflow automatizzato:

#### 1. **Pre-Commit Checklist Automatico**
```bash
# Workflow completo automatico prima di ogni commit
npm run lint               # Fix automatico problemi ESLint
npx tsc --noEmit          # Verifica TypeScript senza errori
git add .                 # Stage dei file modificati automaticamente
git status                # Controllo finale delle modifiche
```

#### 2. **Commit Message Standard (Conventional Commits)**
Formato obbligatorio per il progetto MES Aerospazio:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types disponibili:**
- `feat`: Nuova funzionalità business (es. QR scanner, workflow automation)
- `fix`: Correzione bug o errori
- `refactor`: Ristrutturazione codice senza cambio funzionalità
- `docs`: Documentazione (CLAUDE.md, README, commenti)
- `test`: Aggiunta o modifica test
- `style`: Formattazione, linting (ESLint, Prettier)
- `chore`: Manutenzione (dependencies, build, configurazione)
- `perf`: Ottimizzazioni performance
- `security`: Correzioni sicurezza

**Scopes suggeriti per MES Aerospazio:**
- `auth`: Sistema autenticazione (NextAuth, JWT, password reset)
- `qr`: Sistema QR Scanner (scanning, generazione, offline)
- `odl`: Gestione ODL (Work Orders, workflow automation)
- `production`: Tracking produzione, dashboard operatore
- `departments`: Gestione reparti (Clean Room, Autoclavi, NDI)
- `admin`: Funzionalità amministrazione utenti
- `database`: Schema Prisma, migrazioni, seed
- `ui`: Componenti UI (Atomic Design, Material-UI)
- `api`: API routes, validazione Zod
- `workflow`: Sistema trasferimento automatico tra reparti

#### 3. **Esempi Commit Messages per il Progetto**
```bash
# Nuove funzionalità
feat(qr): implementa scanning offline con sync automatico
feat(workflow): aggiunge trasferimento automatico ODL tra reparti
feat(auth): implementa sistema password reset con email

# Bug fixes
fix(production): corregge calcolo KPI per turnisti Clean Room
fix(database): risolve foreign key constraint su AutoclaveLoad
fix(ui): corregge responsive design dashboard operatore mobile

# Refactoring
refactor(api): migra a service layer pattern per tutti gli endpoint
refactor(components): applica Atomic Design a navbar e sidebar
refactor(auth): unifica logica autenticazione NextAuth v5

# Documentazione
docs(claude): aggiorna workflow Git e commit best practices
docs(api): aggiunge documentazione endpoint /api/production
docs(database): documenta schema estensioni department-specific

# Chore
chore(deps): aggiorna Next.js 15.3.4 e Material-UI v7
chore(lint): applica nuove regole ESLint 9 con flat config
chore(docker): ottimizza container PostgreSQL per development
```

#### 4. **Workflow Automatico Completo**
```bash
# Comando singolo per commit pulito e sicuro
function commit_auto() {
  echo "🔍 Running pre-commit checks..."
  
  # 1. Lint automatico con fix
  npm run lint
  if [ $? -ne 0 ]; then
    echo "❌ ESLint errors found. Please fix manually."
    return 1
  fi
  
  # 2. TypeScript check
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix before commit."
    return 1
  fi
  
  # 3. Check branch status
  git status --porcelain
  
  # 4. Auto-stage files
  git add .
  
  # 5. Show diff summary
  echo "📋 Changes to be committed:"
  git diff --cached --stat
  
  # 6. Commit with message
  echo "✅ Ready to commit. Use: git commit -m 'type(scope): description'"
}

# Aggiungere al .bashrc/.zshrc per uso frequente
alias pre-commit='commit_auto'
```

#### 5. **Branch Strategy & Naming**
```bash
# Branch naming convention
feature/auth-password-reset       # Nuove funzionalità
fix/qr-scanner-offline-sync      # Bug fixes  
refactor/atomic-design-migration  # Refactoring
docs/claude-git-workflow         # Documentazione
chore/eslint-upgrade             # Manutenzione

# Workflow branches
main                             # Production ready
develop                          # Integration branch
feature/*                        # Feature branches da develop
hotfix/*                         # Fix urgenti da main
```

#### 6. **Automated Commit con Validazione e Dettagli**
```bash
# Script avanzato per commit automatici con messaggi dettagliati
function smart_commit() {
  local commit_message="$1"
  
  if [ -z "$commit_message" ]; then
    echo "Usage: smart_commit 'feat(scope): description'"
    return 1
  fi
  
  # Pre-commit validation
  echo "🚀 Starting automated commit process..."
  
  # 1. Clean build
  echo "🧹 Cleaning build artifacts..."
  rm -rf .next
  
  # 2. Lint with auto-fix
  echo "🔧 Running ESLint with auto-fix..."
  npm run lint
  
  # 3. TypeScript validation
  echo "📘 Validating TypeScript..."
  npx tsc --noEmit
  
  # 4. Run tests if available
  if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
    echo "🧪 Running tests..."
    npm test
  fi
  
  # 5. Stage and commit
  echo "📦 Staging changes..."
  git add .
  
  echo "💾 Creating commit: $commit_message"
  git commit -m "$commit_message"
  
  echo "✅ Commit completed successfully!"
  git log --oneline -1
}

# Template per commit dettagliati (utilizzare con HEREDOC)
function detailed_commit() {
  local type="$1"
  local scope="$2" 
  local title="$3"
  local description="$4"
  
  git commit -m "$(cat <<EOF
$type($scope): $title

$description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
}

# Esempi specifici per MES Aerospazio:
# detailed_commit "refactor" "navigation" "riorganizza menu seguendo best practice MES" "- Ristruttura seguendo standard ISA-95\n- Elimina duplicati e ottimizza workflow\n- Applica progressive disclosure"
# detailed_commit "feat" "qr" "implementa modalità offline scanner" "- LocalStorage per sync automatico\n- Timer persistence cross-page\n- Workflow integration completo"
# detailed_commit "fix" "auth" "corregge validazione password reset" "- Migliora validazione email format\n- Fix expire token handling\n- UX improvements nel flow"
```

## 🔧 MULTI-CLAUDE DEVELOPMENT WORKFLOW

### Per lavorare con più istanze Claude Code simultaneamente:

#### 1. **Assegnazione Porte per Istanza**
```bash
# Claude Instance 1 (Primary) - Porta 3000
npm run dev

# Claude Instance 2 (Secondary) - Porta 3001  
npm run dev -- -p 3001

# Claude Instance 3 (Tertiary) - Porta 3002
npm run dev -- -p 3002
```

#### 2. **Controllo Stato Servizi**
```bash
# Verifica quali porte sono in uso
ss -tlnp | grep :300[0-9]

# Verifica processi Next.js attivi
ps aux | grep -E "(next|node)" | grep -v grep

# Ferma tutti i processi Next.js se necessario
pkill -f "next dev" || pkill -f "next"
```

#### 3. **Gestione Cache e Conflitti**
```bash
# Pulizia cache quando si hanno conflitti
rm -rf .next && rm -rf node_modules/.cache

# Reset completo database (solo se necessario)
npm run db:push --force-reset
```

#### 4. **Strategia di Lavoro Multi-Claude**
- **Claude 1**: Sviluppo frontend e UI (porta 3000)
- **Claude 2**: Sviluppo backend e API (porta 3001) 
- **Claude 3**: Database e testing (porta 3002)

#### 5. **Comandi Sicuri per Coordinamento**
```bash
# Prima di iniziare, verifica stato
docker compose ps                 # Database containers
ss -tlnp | grep :300[0-9]       # Porte in uso
git status                       # Modifiche pending

# Avvia su porta specifica
PORT=3001 npm run dev            # Alternativa per forzare porta
npm run dev -- -p 3001          # Metodo preferito

# Termina pulitamente
# Usa sempre Ctrl+C nel terminale invece di kill forzato
```

### 6. **Risoluzione Problemi Comuni**
```bash
# Errore "Port in use"
npm run dev -- -p 3001

# Errore "ENOENT manifest files"  
rm -rf .next && npm run dev

# Errore "Database connection"
docker compose restart postgres

# Errore "Turbopack build issues"
npm run dev:standard
```

### 7. **Best Practices Multi-Claude**
- ✅ **Sempre specifica porta**: `npm run dev -- -p 300X`
- ✅ **Controlla stato prima**: `ss -tlnp | grep :300[0-9]`
- ✅ **Usa Ctrl+C per terminare**: mai `kill -9`
- ✅ **Pulisci cache in caso di errori**: `rm -rf .next`
- ✅ **Coordina modifiche database**: una sola istanza per migrations
- ❌ **Non usare stessa porta**: porta a conflitti manifest
- ❌ **Non killare processi brutalmente**: corrompe cache

### Troubleshooting Commands
```bash
# Database connection issues
docker compose restart postgres
docker compose logs -f postgres

# Schema sync issues  
npm run db:generate
npm run db:push

# Port conflicts
npm run dev -- -p 3001

# Reset database (WARNING: loses data)
npx prisma db push --force-reset

# Build with bundle analysis
BUNDLE_ANALYZE=true npm run build

# Production build with optimizations
NODE_ENV=production npm run build
```

### Microservices Development
```bash
# Note: Python microservices not yet implemented in current version
# docker compose up optimization-service  # Start autoclave nesting service (planned)
# docker compose up assignment-service    # Start ODL assignment service (planned)
# docker compose logs optimization-service # Monitor service logs (planned)
```

## Current Development Status

**Phase**: Operator Pages & Production Workflow Complete
- ✅ Next.js 15.3.4 with TypeScript and Turbopack
- ✅ Material-UI v7 with custom theme and dark mode
- ✅ NextAuth.js v5 authentication with JWT and role-based access
- ✅ Comprehensive user management with password reset functionality
- ✅ Department-specific role assignment (CAPO_REPARTO, CAPO_TURNO, OPERATORE)
- ✅ Prisma ORM with comprehensive database schema (19 tables)
- ✅ Docker development environment (PostgreSQL + Redis)
- ✅ Zod validation schemas for all domains
- ✅ Atomic Design component structure with MUI integration
- ✅ ESLint 9 with flat config - production build tested
- ✅ **Complete API Routes**: Auth, admin, ODL, parts, departments, production endpoints
- ✅ **Protected Route System**: Middleware-based with role guards
- ✅ **Database Schema**: Full domain model with audit trails and sync tracking
- ✅ **QR Scanner System**: Offline-capable with automatic timer and workflow integration
- ✅ **Operator Dashboard**: KPI tracking, ODL management, production monitoring
- ✅ **Automatic Workflow**: Department-to-department ODL transfer system
- ✅ **Production Overview**: Complete production monitoring with filtering and statistics
- 🔄 Python microservices architecture for complex algorithms

## Project Documentation

Detailed documentation available in `/docs`:
- `REQUIREMENTS.md`: Business requirements and user stories
- `TECHNICAL_ARCHITECTURE.md`: System design and technology choices
- `MVP_DEFINITION.md`: MVP scope and priorities  
- `DEVELOPMENT_ROADMAP.md`: 8-week implementation timeline

## Architecture

### Tech Stack

**Frontend & Core:**
- Next.js 15.3.4 (App Router) with Turbopack
- React 19.0.0 with TypeScript 5.x strict mode
- Material-UI v7 with Emotion styling
- Tailwind CSS v4 Alpha (PostCSS-based, coexists with MUI)

**Authentication & Data:**
- NextAuth.js v5 with Prisma adapter, JWT sessions, role-based access
- Prisma ORM 6.x with PostgreSQL database
- Zod validation schemas for runtime type safety
- React Query (TanStack) for server state + Zustand for client state

**Production Features:**
- QR Code: @zxing/browser (React 19 compatible) + qrcode generation
- Background Jobs: BullMQ with Redis (ioredis)
- Data Visualization: Recharts + date-fns
- Mobile-first responsive design with 44px touch targets

**Microservices (Python):**
- Autoclave Nesting Algorithm: 2D bin packing optimization service
- ODL Assignment Engine: Automatic workforce allocation based on skills/availability
- Performance Metrics: Real-time analytics and KPI calculation

### Architecture Patterns  
- **Hybrid Architecture**: Next.js monolithic core + Python microservices for algorithms
- **Domain-Driven Design**: Organized by business domains (production, planning, quality)
- **Atomic Design**: UI components hierarchy (atoms → molecules → organisms → templates)
- **Type Safety**: End-to-end TypeScript with runtime validation via Zod
- **API Gateway**: Next.js API routes proxy requests to Python microservices

### Project Structure (Current Implementation)
```
src/
├── app/                    # Next.js App Router with route groups
│   ├── (auth)/            # Authentication pages (login, register, profile, etc.)
│   │   ├── admin/users/   # User management for admin
│   │   ├── change-password/ # Password change functionality
│   │   ├── forgot-password/ # Password reset flow
│   │   └── reset-password/  # Password reset completion
│   ├── (dashboard)/       # Main application dashboard
│   │   ├── my-department/ # Operator dashboard with KPI and ODL management
│   │   ├── production/    # Production overview with filtering and statistics
│   │   ├── qr-scanner/    # QR scanner with offline support and timer
│   │   ├── parts/         # Parts management interface
│   │   ├── planning/      # Production planning interface
│   │   └── production/    # Production modules (cleanroom, autoclavi)
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin-only endpoints (users, cleanup)
│   │   ├── departments/   # Department management
│   │   ├── odl/           # ODL (Work Order) CRUD
│   │   ├── parts/         # Parts management
│   │   ├── production/    # Production dashboard, events, statistics
│   │   ├── workflow/      # Automatic workflow transfer system
│   │   └── health/        # Health check endpoint
│   ├── page.tsx           # Protected dashboard home
│   └── layout.tsx         # Root layout with providers
├── components/            # Atomic Design System
│   ├── atoms/             # Button, Input, Card (MUI wrappers)
│   ├── auth/              # Authentication components (forms, guards)
│   ├── molecules/         # NavigationItem, form components
│   ├── organisms/         # NavigationSidebar, complex UI components
│   ├── templates/         # DashboardLayout (implemented)
│   └── providers/         # MUI Theme + React Query providers
├── domains/               # DDD business domains with complete schemas
│   ├── core/              # Core entities (ODL, Part) with services
│   ├── optimization/      # Autoclave optimization schemas
│   ├── production/        # Production event tracking + WorkflowService
│   └── user/              # Complete auth schemas (login, register, reset)
├── config/                # Configuration files
│   └── navigationConfig.ts # Role-based navigation configuration
├── lib/                   # Core infrastructure
│   ├── auth.ts           # NextAuth config with Prisma adapter
│   ├── auth-utils.ts     # Authentication utilities
│   ├── email-service.ts  # Email service for password reset
│   ├── prisma.ts         # Prisma client singleton
│   ├── theme.ts          # Material-UI theme with mobile optimization
│   └── cleanup-tasks.ts  # Background cleanup jobs
├── hooks/                 # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── services/              # API and external services
│   ├── api/              # API client layer
│   └── gamma-sync/       # Gamma MES integration (planned)
├── stores/                # Zustand state management
├── utils/                 # Business utilities
│   ├── constants.ts      # Business constants (roles, statuses, shifts)
│   └── helpers.ts        # Utilities (QR parsing, date formatting, validation)
└── middleware.ts         # Route protection with NextAuth
```

## Business Domain Context

### Core Functionality
- **ODL (Work Orders)**: Track aerospace parts through production departments
- **QR Code System**: Generate unique codes for ODL tracking, scan for department entry/exit
- **Clean Room**: Lamination department with time tracking and resource allocation
- **Autoclavi**: Curing department with batch optimization algorithm (2D nesting problem)
- **Gamma Integration**: Sync data from existing MES Gamma TeamSystem via file exports

### Production Flow
```
ODL Creation → Clean Room (Lamination) → Autoclavi (Curing) → NDI → Rifilatura → etc.
    ↓             ↓ QR Scan In/Out      ↓ Batch Optimization (Python Service)
Gamma Sync    Time Tracking         2D Layout Planning + Auto Assignment
```

### Key Business Rules & Constraints
- **ODL (Work Orders)**: Unique alphanumeric Part Numbers (format: 8G5350A0...)
- **Autoclave Constraints**: Compatible curing cycles, vacuum line types, physical size limits
- **Production Shifts**: Standard 6-14, 14-22 with shift supervisor tracking
- **Mobile-First Design**: Operators use personal smartphones for QR scanning in industrial environment
- **Aerospace Compliance**: All production events tracked for audit trails and quality standards
- **Department Workflow**: Sequential processing Clean Room → Autoclavi → NDI → Rifilatura
- **Offline Capability**: QR scanner works offline with automatic sync when connection restored
- **Italian Business Context**: UI in Italian, follows Italian manufacturing conventions

## Critical Implementation Architecture

### Authentication Flow
- **NextAuth v5** with custom Credentials provider (`src/lib/auth.ts`)
- **Multi-level Role System**: 
  - Global roles: `UserRole` enum (ADMIN, SUPERVISOR, OPERATOR)
  - Department roles: `DepartmentRole` enum (CAPO_REPARTO, CAPO_TURNO, OPERATORE)
- **Complete Password Management**: Registration, login, change, forgot/reset flow
- **Route protection**: All routes protected by default via `middleware.ts`, except auth pages
- **Session management**: JWT tokens with user ID, role, and department embedded
- **Password security**: bcryptjs hashing with validation rules
- **Admin Features**: User management, status toggle, cleanup tasks
- **Email Integration**: Password reset emails via email service

### Database Architecture
- **Comprehensive Prisma schema** (`prisma/schema.prisma`): 19 tables with complete domain model
- **User Management**: User, PasswordResetToken with department-specific roles
- **Core Entities**: Part, ODL, Department, Tool with master data management
- **Production Tracking**: ProductionEvent for audit trail, AutoclaveLoad for batch optimization
- **Authentication**: NextAuth Account/Session tables with JWT integration
- **Autoclave System**: Autoclave, AutoclaveLoad, AutoclaveLoadItem for 2D optimization
- **Tool Management**: Tool, PartTool for lamination tooling requirements
- **Curing Cycles**: CuringCycle with dual-phase temperature/pressure profiles
- **Gamma Integration**: GammaSyncLog for file-based MES synchronization
- **Performance Indexes**: Optimized queries for production workloads
- **Department Extensions**: Optional department-specific configurations (PartNDI, PartAutoclave, PartCleanroom) for isolated reparto data management

### Validation Architecture
- **Zod schemas** in `src/domains/*/schemas/`: Shared between client/server for type safety
- **Form validation**: React Hook Form + Zod resolver pattern in auth pages
- **API validation**: Server-side schema validation in API routes before database operations
- **Runtime safety**: TypeScript inference from Zod schemas ensures compile-time + runtime type checking

### Component Architecture Strategy
- **Atomic Design implemented**: `src/components/atoms/` wrap MUI components with custom props
- **MUI integration**: Custom theme in `src/lib/theme.ts` with mobile-first 44px touch targets
- **Provider pattern**: Root layout includes MUI ThemeProvider + React Query client
- **Mobile optimization**: All components designed for smartphone use in industrial environment

### QR Code System Architecture
- **Generation**: `qrcode` library creates codes with ODL/Department data as JSON
- **Scanning**: `@zxing/browser` (React 19 compatible) for camera-based scanning
- **Data format**: JSON with `{type, id, timestamp}` structure parsed by `src/utils/helpers.ts`
- **Validation**: QR data validation through Zod schemas before processing
- **Offline Support**: LocalStorage for unsynced scans with automatic sync when online
- **Timer Integration**: Automatic timer start/stop with ENTRY/EXIT events
- **Workflow Integration**: Automatic department transfer triggered on EXIT events

### Automatic Workflow System
- **WorkflowService**: Manages sequential department transfers (Clean Room → Autoclavi → NDI → Rifilatura)
- **Transfer Logic**: Validates ODL status, updates state, creates events, sends notifications
- **Validation**: Multi-constraint checking before allowing department transitions
- **Graceful Degradation**: System continues working if automatic transfer fails
- **Audit Trail**: All workflow events logged with automatic/manual distinction
- **IMPORTANTE**: Il reparto MOTORI è completamente autonomo e separato dal flusso ODL principale - non deve essere considerato nel workflow automatico

## MVP Development Plan

The project follows an 8-week MVP timeline focusing on Clean Room and Autoclavi departments:

### Week 1-2: Foundation
- Authentication system (JWT + NextAuth.js)
- QR code generation and scanning
- Basic ODL management

### Week 3-4: Clean Room Implementation  
- Production event tracking
- Time monitoring and alerts
- Dashboard for department status

### Week 5-6: Autoclavi Optimization (Critical)
- Batch optimization algorithm (First-Fit Decreasing heuristic)
- 2D visualization of autoclave layout
- Multi-constraint optimization (cycles, dimensions, priorities)

### Week 7-8: Integration & Deploy
- Gamma MES file synchronization
- Basic reporting system
- Production deployment

## Current Implementation Status & Next Steps

### Completed Operator Pages & Production System
- **Authentication System**: Complete user management with role-based access
- **Database Schema**: Full domain model with 19 tables and proper indexing
- **API Foundation**: All core endpoints implemented (auth, admin, ODL, parts, departments, production, workflow)
- **Component Architecture**: Atomic design system with MUI integration
- **Development Environment**: Docker, Prisma, TypeScript, ESLint all configured
- **QR Scanner System**: Complete offline-capable scanner with automatic timer integration
- **Operator Dashboard**: KPI tracking, ODL management, production monitoring at `/my-department`
- **Production Overview**: Complete production monitoring with filtering at `/production`
- **Automatic Workflow**: Department-to-department ODL transfer system with validation
- **Navigation System**: Role-based navigation with proper access control

### Next Development Priorities
1. **Admin Pages**: Complete `/admin/departments`, `/admin/settings` implementation
2. **Advanced Production**: NDI module, detailed reporting systems
3. **Department Management**: Pages for department heads and shift supervisors
4. **Python Microservices**: Optimization algorithms for autoclave nesting

### Python Microservices Strategy (Future Implementation)
Complex computational algorithms will be implemented as separate Python microservices:

**1. Autoclave Nesting Optimization Service** (Planned)
- 2D bin packing algorithm for optimal space utilization
- Multi-constraint satisfaction (cycles, dimensions, vacuum lines, priorities)
- Performance target: <30 seconds optimization time
- Libraries: NumPy, SciPy, OR-Tools for advanced optimization
- Fallback to manual positioning if optimization fails

**2. ODL Assignment Engine Service** (Planned)
- Automatic workforce allocation based on skills matrix and availability
- Real-time workload balancing across operators
- Machine learning-based performance prediction
- Shift optimization and scheduling algorithms

**3. Performance Analytics Service** (Planned)
- Real-time KPI calculation and trend analysis
- Production efficiency metrics and bottleneck detection
- Predictive maintenance algorithms for equipment

### Microservice Communication
- **API Gateway**: Next.js API routes proxy requests to Python services
- **Data Format**: JSON payloads with Zod validation on both ends
- **Error Handling**: Graceful degradation with manual override options
- **Monitoring**: Health checks and performance metrics via Docker Compose

### Mobile-First Design
Operators use personal smartphones for QR scanning:
- Large touch targets (44px minimum)
- High contrast for industrial lighting
- Offline-capable PWA for network interruptions
- Simple, single-purpose interfaces

### Integration Considerations
- **Gamma MES**: Read-only file-based sync (CSV/Excel exports) - schema ready
- **No direct database access** to existing systems for security
- **Python Services**: Docker containers with REST APIs (when implemented)
- **Current Deployment**: Docker Compose with PostgreSQL + Redis
- **Production**: On-premise server deployment planned

### Development Workflow Tips

#### 🔄 **Pre-Commit Workflow (OBBLIGATORIO)**
```bash
# Sempre eseguire prima di ogni commit
npm run lint               # Auto-fix ESLint errors
npx tsc --noEmit          # Validate TypeScript
npm run db:seed-complete   # Test dopo modifiche database
```

#### 🗃️ **Database Development Workflow**
- **Schema Changes**: `npm run db:generate` dopo modifiche schema → `npm run db:push` per development
- **Testing Data**: **SEMPRE** `npm run db:seed-complete` dopo nuove features per validare funzionalità
- **Production Migrations**: `npm run db:migrate` per production-ready migrations
- **Data Validation**: Test UI completo dopo seed per verificare integrazione

#### 🔐 **Authentication & Security Testing**
- **User Creation**: `/register` per nuovi utenti, admin panel `/admin/users` per gestione
- **Multi-Role Testing**: Use seed credentials (admin, supervisor, operator) per test completi
- **API Testing**: Health check `/api/health`, monitor authentication in browser dev tools
- **Security Headers**: Verificare CSP policies in Next.js config prima deploy

#### 🧪 **Component Development Standards**
- **Atomic Design**: SEMPRE seguire pattern atoms → molecules → organisms → templates in `src/components/`
- **Material-UI v7**: Usare SOLO sintassi `<Grid size={{ xs: 12, sm: 6 }}>` - old syntax deprecata
- **Mobile-First**: Tutti componenti 44px minimum touch targets per uso smartphone industriale
- **Type Safety**: Zod schemas obbligatori per all domains, TypeScript strict mode

#### 📊 **Production Readiness Checklist**
```bash
# Prima di ogni deploy/PR importante
npm run build              # Verify production build
npm run lint              # Code quality check
npx tsc --noEmit         # TypeScript validation
docker compose up -d      # Test with real database
npm run db:seed-complete  # Full integration test
```

#### 🚀 **Git Workflow Integration**
- **Branch Creation**: Sempre da `develop`, naming: `feature/scope-description`
- **Commit Messages**: Format obbligatorio `type(scope): description` (vedi sezione Git & Version Control)
- **Pre-Push**: Verificare `npm run build` success prima push
- **Code Review**: Include screenshot per UI changes, database migration notes

### Service Layer Architecture (CRITICAL)
- **All services are STATIC**: Services in `src/domains/*/services/` use static methods only
- **Example**: `PartService.findMany()` NOT `new PartService().findMany()`
- **Pattern**: `export class ServiceName { static async methodName() {} }`
- **Common Error**: Using instance methods breaks API routes with "is not a function" errors

### Seed Management & Testing Protocol
- **Complete Seed File**: `prisma/seed-complete.ts` contains comprehensive test data for all domains
- **When to Update Seed**: Every time new features/entities are added, update the seed file accordingly
- **Validation Process**: Run complete seed → Test frontend functionality → Verify all features work
- **Seed Content**: Users, departments, parts, ODL, tools, autoclaves, production events, audit logs
- **Test Credentials**: 
  - Admin: `admin@mantaaero.com / password123`
  - Supervisor: `capo.cleanroom@mantaaero.com / password123`
  - Operator: `op1.cleanroom@mantaaero.com / password123`

### Critical Architecture Decisions

**Material-UI Grid v7 Breaking Changes** (IMPORTANT):
- **DEPRECATO**: `<Grid item xs={12} sm={6} md={4}>` sintassi NON supportata
- **CORRETTO**: `<Grid size={{ xs: 12, sm: 6, md: 4 }}>` nuova sintassi obbligatoria  
- **Container**: `<Grid container spacing={3}>` rimane invariato
- **Props rimosse**: `item`, `xs`, `sm`, `md`, `lg`, `xl` non esistono più
- **Unificata**: Tutte le dimensioni responsive ora in `size` prop
- **Migrazione**: Converti SEMPRE `item xs={...}` → `size={{ xs: ... }}`
- **TypeScript Error**: Compilation fails if old syntax is used

**Hybrid Monolith + Microservices Strategy**:
- **Core Application**: Next.js monolith handles all UI, authentication, CRUD operations, and business logic
- **Computational Services**: Python microservices for complex algorithms (2D bin packing, optimization)
- **Data Flow**: Next.js API routes act as gateway, proxying requests to Python services
- **Deployment**: Single Docker Compose with all services for development simplicity
- **Graceful Degradation**: Manual fallbacks when optimization services fail

**Security-First Design**:
- **Route Protection**: Middleware-based auth on ALL routes except `/api/auth/*` and `/auth/*`
- **Role-Based Access**: Multi-level (global + department-specific) role system
- **Security Headers**: Comprehensive CSP, HSTS, and OWASP headers in next.config.ts
- **Input Validation**: Zod schemas validate ALL API inputs/outputs
- **Production Ready**: Standalone build + security headers for production deployment

### Key Implementation Patterns

**Authentication Pattern**:
```typescript
// Route protection in middleware.ts
// Role-based access in components with RoleGuard
// JWT sessions with user/role/department data
```

**API Pattern**:
```typescript
// All routes: Zod validation → Service layer → Prisma operations
// Error handling with proper HTTP status codes
// Authentication required for all non-auth routes
```

**Component Pattern**:
```typescript
// Atomic Design: atoms (MUI wrappers) → molecules → organisms → templates
// Custom theme with mobile-first 44px touch targets
// TypeScript strict mode with proper prop types
```

**Database Pattern**:
```typescript
// Domain-driven entities with proper relations
// Audit trails for all production operations
// Performance indexes for common queries
// Sync tracking for external integrations
```

**Workflow Pattern**:
```typescript
// WorkflowService manages sequential department transitions
// Automatic transfer on EXIT events with validation
// Graceful fallback if transfer fails
// Complete audit trail for compliance
```

**Offline-First Pattern**:
```typescript
// LocalStorage for unsynced data
// Automatic sync when connection restored
// Visual indicators for online/offline status
// Timer persistence across page refreshes
```

## Department-Specific Data Management Strategy

### Architecture Pattern: Extension Tables
Il sistema gestisce dati supplementari per ogni reparto attraverso **tabelle di estensione opzionali** che mantengono l'isolamento tra reparti:

**IMPORTANTE**: Le **dimensioni fisiche** delle parti vengono derivate dalle **relazioni con i Tools** (utensili di laminazione), non ridondante nelle estensioni. Le tabelle di estensione contengono solo **metadati specifici del reparto** e **configurazioni processo**.

**Pattern**: One-to-One Optional Extensions per Part/ODL
```sql
-- NDI Department Extensions
model PartNDI {
  id                String   @id @default(cuid())
  partId            String   @unique
  standardId        String   // "ASTM-E1444", "ISO-5817"
  inspectionType    NDIType[]// ULTRASONIC, RADIOGRAPHIC, PENETRANT
  inspectionDepth   Float?   // mm profondità ispezione
  defectThreshold   Float?   // % accettabilità difetti
  requiredEquipment Json     // {"ultrasonic": ["UT-500"], "radiographic": ["XR-200"]}
  inspectionZones   Json?    // Aree specifiche da ispezionare
  reportTemplate    String?  // Template report NDI
  
  part              Part     @relation("PartNDIConfig", fields: [partId], references: [id])
}

-- Autoclave Department Extensions (enhanced)
model PartAutoclave {
  id                String   @id @default(cuid())
  partId            String   @unique
  nestingPriority   Int      @default(1)
  vacuumLineType    VacuumType // SINGLE, DOUBLE, TRIPLE
  compatibleLoads   String[] // IDs altri part compatibili
  separationDistance Float?  // Distanza minima da altri pezzi
  
  part              Part     @relation("PartAutoclaveConfig", fields: [partId], references: [id])
}

-- Clean Room Department Extensions
model PartCleanroom {
  id                String   @id @default(cuid())
  partId            String   @unique
  requiredTools     String[] // Tool part numbers necessari (relazione via PartTool)
  setupTime         Int?     // Tempo setup in minuti
  cycleTime         Int?     // Tempo ciclo standard
  skillLevel        SkillLevel // BASIC, INTERMEDIATE, ADVANCED
  specialRequirements String? // Note speciali
  
  part              Part     @relation("PartCleanroomConfig", fields: [partId], references: [id])
  // NOTA: Dimensioni fisiche derivate da Part->Tools relazione, non ridondanti qui
}
```

### Data Management Patterns

**Dimensioni da Tools Pattern**:
```typescript
// Dimensioni fisiche derivate dai Tools (utensili di laminazione)
const getPartDimensions = async (partId: string) => {
  const part = await prisma.part.findUnique({
    where: { id: partId },
    include: {
      partTools: {
        include: {
          tool: true // base, height, weight da Tool table
        }
      }
    }
  });
  
  // Dimensioni calcolate da utensili associati
  const dimensions = part.partTools.map(pt => ({
    length: pt.tool.base,
    height: pt.tool.height,
    weight: pt.tool.weight
  }));
  
  return dimensions;
};
```

**Service Layer Pattern**:
```typescript
// src/domains/departments/ndi/services/NDIService.ts
export class NDIService {
  async getPartNDIConfig(partId: string) {
    return await prisma.partNDI.findUnique({
      where: { partId },
      include: { 
        part: {
          include: {
            partTools: { include: { tool: true } } // Include dimensioni da tools
          }
        }
      }
    });
  }
  
  async ensureConfigExists(partId: string) {
    // Crea configurazione default se non esiste (senza dimensioni ridondanti)
    return await prisma.partNDI.upsert({
      where: { partId },
      create: { partId, ...DEFAULT_NDI_CONFIG },
      update: {}
    });
  }
}
```

**API Routes Pattern**:
```typescript
// src/app/api/parts/[id]/config/[department]/route.ts
export async function GET(request: Request, { params }) {
  const departmentType = params.department.toUpperCase() as DepartmentType;
  const config = await partConfigService.getPartWithDepartmentConfig(
    params.id, 
    departmentType
  );
  return Response.json(config);
}
```

**Frontend Integration**:
```typescript
// React Query hooks per lazy loading configurazioni
export function useDepartmentConfig(partId: string, department: DepartmentType) {
  return useQuery({
    queryKey: ['part-config', partId, department],
    queryFn: () => api.getPartDepartmentConfig(partId, department),
    enabled: !!partId && !!department
  });
}
```

### Migration Strategy
- **Database Evolution**: Prisma migrations con `npm run db:migrate`
- **Backward Compatibility**: Configurazioni opzionali non impattano esistente
- **Data Population**: Default values via service layer per configurazioni mancanti
- **Performance**: Lazy loading + indici strategici + caching React Query

### Benefits
✅ **Isolamento**: Ogni reparto gestisce autonomamente i propri dati
✅ **Estensibilità**: Nuovi reparti non impattano quelli esistenti
✅ **Performance**: Query ottimizzate per dominio specifico
✅ **Type Safety**: Schema Zod e validazione per ogni reparto
✅ **Manutenibilità**: Codice organizzato per reparto con clear separation of concerns
✅ **No Ridondanza**: Dimensioni fisiche derivate da Tools, estensioni contengono solo metadati specifici

## Memories

### Language and Interaction
- **Rispondi in italiano**: Indicates a preference for Italian language interactions when possible

### Project Documentation
- Aggiorna i requisiti e i documenti quando vengono definite nuove funzionalità. 
- Interrogami ogni qual volta chiedo implementazione di funzionalità non previste precedentemente al fine di implementarle secondo linee guida corrette

## Production Deployment & Monitoring

### Environment Configuration
- **Development**: Docker Compose with PostgreSQL + Redis
- **Production**: Standalone Next.js build with Docker containers
- **Environment Variables**: See `.env.example` for required configuration
- **Security Headers**: Comprehensive CSP and OWASP headers configured in `next.config.ts`

### Health Monitoring
- **Health Check Endpoint**: `/api/health` for container orchestration
- **Database Connection**: Prisma client with connection pooling
- **Background Jobs**: BullMQ with Redis for async operations
- **Logging**: Structured logging with request tracing for production debugging