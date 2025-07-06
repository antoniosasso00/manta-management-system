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
npm run dev -- -p 3001 # Force specific port (use when multiple Claude instances)
npm run build        # Create production build  
npm run start        # Start production server
npm run lint         # Run ESLint checks
npm run type-check   # Type check without emitting files
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

## Memories
- **Rispondi in italiano**: Indicates a preference for Italian language interactions when possible
- **Project Documentation**: Aggiorna i requisiti e i documenti quando vengono definite nuove funzionalità