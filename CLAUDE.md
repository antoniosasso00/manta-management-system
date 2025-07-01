# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MES Aerospazio is a Manufacturing Execution System for aerospace component production, specializing in carbon fiber composite manufacturing. The system tracks work orders (ODL) through production departments including Clean Room (lamination) and Autoclaves (curing cycles) using QR code scanning and automated batch optimization.

Built as a Next.js 15.3.4 application following Domain-Driven Design principles with Atomic Design System UI components. Uses hybrid architecture: monolithic core with specialized Python microservices for computationally intensive algorithms.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run build        # Create production build  
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Database
```bash
docker-compose up -d           # Start PostgreSQL and Redis for development
npm run db:generate            # Generate Prisma client after schema changes
npm run db:push                # Push schema changes to database (development)
npm run db:migrate             # Create and run database migrations (production)
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed database with initial data
docker-compose down            # Stop services
docker-compose logs postgres   # View database logs
docker-compose ps              # Check container status
docker-compose restart postgres # Restart database container
```

### Development Setup (First Time)
```bash
npm install                    # Install dependencies
docker-compose up -d           # Start PostgreSQL and Redis
npm run db:push                # Setup database schema
npm run dev                    # Start development server
# Visit http://localhost:3000/register to create first user
```

### Quick Start (Single Command)
```bash
docker-compose up -d && npm run db:push && npm run dev
# Then open http://localhost:3000 and go to /register
```

### Troubleshooting Commands
```bash
# Database connection issues
docker-compose restart postgres
docker-compose logs -f postgres

# Schema sync issues  
npm run db:generate
npm run db:push

# Port conflicts
npm run dev -- -p 3001

# Reset database (WARNING: loses data)
npx prisma db push --force-reset
```

### Microservices Development
```bash
# Note: Python microservices not yet implemented in current version
# docker-compose up optimization-service  # Start autoclave nesting service (planned)
# docker-compose up assignment-service    # Start ODL assignment service (planned)
# docker-compose logs optimization-service # Monitor service logs (planned)
```

## Current Development Status

**Phase**: Authentication & Core Infrastructure Complete
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
- ✅ **Complete API Routes**: Auth, admin, ODL, parts, departments endpoints
- ✅ **Protected Route System**: Middleware-based with role guards
- ✅ **Database Schema**: Full domain model with audit trails and sync tracking
- 🚧 UI Components for Part/ODL management (forms, tables, selectors)
- 🚧 QR scanning components and production event tracking
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
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin-only endpoints (users, cleanup)
│   │   ├── departments/   # Department management
│   │   ├── odl/           # ODL (Work Order) CRUD
│   │   ├── parts/         # Parts management
│   │   └── health/        # Health check endpoint
│   ├── production/        # Production modules (cleanroom, autoclavi)
│   ├── planning/          # Production planning interface
│   ├── page.tsx           # Protected dashboard home
│   └── layout.tsx         # Root layout with providers
├── components/            # Atomic Design System
│   ├── atoms/             # Button, Input, Card (MUI wrappers)
│   ├── auth/              # Authentication components (forms, guards)
│   ├── molecules/         # (ready for QRScanner, ODLCard)
│   ├── organisms/         # (ready for Navigation, ODLList)
│   ├── templates/         # DashboardLayout (implemented)
│   └── providers/         # MUI Theme + React Query providers
├── domains/               # DDD business domains with complete schemas
│   ├── core/              # Core entities (ODL, Part) with services
│   ├── optimization/      # Autoclave optimization schemas
│   ├── production/        # Production event tracking
│   └── user/              # Complete auth schemas (login, register, reset)
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

### Key Business Rules
- ODL have Part Numbers (format: alphanumeric like 8G5350A0...)
- Autoclavi constraints: compatible curing cycles, vacuum lines, size limits
- Production shifts: 6-14, 14-22
- Mobile-first UI for operators (smartphone QR scanning)

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

### Completed Core Infrastructure
- **Authentication System**: Complete user management with role-based access
- **Database Schema**: Full domain model with 19 tables and proper indexing
- **API Foundation**: All core endpoints implemented (auth, admin, ODL, parts, departments)
- **Component Architecture**: Atomic design system with MUI integration
- **Development Environment**: Docker, Prisma, TypeScript, ESLint all configured

### Next Development Priorities
1. **UI Implementation**: Complete forms and tables for ODL/Part management
2. **QR Code System**: Generation and scanning components
3. **Production Tracking**: Clean Room and Autoclave department modules
4. **Python Microservices**: Optimization algorithms (planned for later phases)

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
- **Database Changes**: Always use `npm run db:generate` after schema modifications
- **Authentication Testing**: Use `/register` to create users, admin panel at `/admin/users`
- **API Testing**: Health check available at `/api/health`
- **Component Development**: Follow atomic design pattern in `src/components/`
- **Type Safety**: All domains have Zod schemas for validation
- **Error Handling**: Authentication errors logged, email service configured

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

## Memories

### Language and Interaction
- **Rispondi in italiano**: Indicates a preference for Italian language interactions when possible