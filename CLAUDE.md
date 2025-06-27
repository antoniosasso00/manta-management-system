# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MES Aerospazio is a Manufacturing Execution System for aerospace component production, specializing in carbon fiber composite manufacturing. The system tracks work orders (ODL) through production departments including Clean Room (lamination) and Autoclaves (curing cycles) using QR code scanning and automated batch optimization.

Built as a Next.js 15.3.4 monolithic application following Domain-Driven Design principles with Atomic Design System UI components.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run build        # Create production build  
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Database (when implemented)
```bash
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema changes to database
npx prisma migrate    # Run database migrations
npx prisma studio     # Open Prisma Studio GUI
```

### Docker Development
```bash
docker-compose up -d           # Start PostgreSQL and Redis for development
docker-compose down            # Stop services
docker-compose logs postgres   # View database logs
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.x (App Router), TypeScript 5.x, Material-UI v6, Tailwind CSS v4
- **Backend**: Next.js API Routes, PostgreSQL 15+, Prisma ORM, BullMQ
- **State Management**: Zustand, React Query (TanStack)
- **Authentication**: NextAuth.js with JWT
- **Validation**: Zod schemas (frontend + backend)
- **QR Code**: react-qr-reader, qrcode generation
- **Charts/Reports**: Recharts, date-fns

### Architecture Patterns  
- **Domain-Driven Design**: Organized by business domains (production, planning, quality)
- **Atomic Design**: UI components hierarchy (atoms → molecules → organisms → templates)
- **Type Safety**: End-to-end TypeScript with runtime validation via Zod

### Project Structure (Planned)
```
src/
├── app/                    # Next.js App Router
├── components/             # Atomic Design System
│   ├── atoms/             # Basic UI elements
│   ├── molecules/         # Component combinations  
│   ├── organisms/         # Complex sections
│   └── templates/         # Page layouts
├── domains/               # DDD business domains
│   ├── production/        # Core domain: ODL tracking
│   ├── planning/          # Autoclave optimization
│   └── user/              # Authentication
├── hooks/                 # Custom React hooks
├── services/              # API layer
├── stores/                # Zustand state stores
└── utils/                 # Shared utilities
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
    ↓             ↓ QR Scan In/Out      ↓ Batch Optimization
Gamma Sync    Time Tracking         2D Layout Planning
```

### Key Business Rules
- ODL have Part Numbers (format: alphanumeric like 8G5350A0...)
- Autoclavi constraints: compatible curing cycles, vacuum lines, size limits
- Production shifts: 6-14, 14-22
- Mobile-first UI for operators (smartphone QR scanning)

## Development Guidelines

### Validation Strategy
- Use Zod schemas for all data validation (frontend + backend)
- Share schemas between client and server
- Runtime type safety with TypeScript inference

### Component Development  
- Follow Atomic Design: wrap MUI components in custom atoms
- Use MUI theming for consistent styling
- Mobile-first responsive design for production floor usage

### Database Integration
- Prisma ORM with PostgreSQL
- File-based Gamma sync (watch folder for CSV/Excel exports)
- Background jobs with BullMQ for heavy processing (autoclave optimization)

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

## Important Implementation Notes

### Autoclave Algorithm Priority
The autoclave batch optimization is the most complex and critical component. Plan for:
- Complex constraint satisfaction (compatible curing cycles, vacuum lines, part dimensions)
- 2D nesting/bin packing problem for optimal space utilization  
- Performance target: <30 seconds optimization time
- Fallback to manual positioning if optimization fails

### Mobile-First Design
Operators use personal smartphones for QR scanning:
- Large touch targets (44px minimum)
- High contrast for industrial lighting
- Offline-capable PWA for network interruptions
- Simple, single-purpose interfaces

### Integration Considerations
- Gamma MES: Read-only file-based sync (CSV/Excel exports)
- No direct database access to existing systems
- Staging: Netlify frontend + local backend via ngrok
- Production: On-premise server deployment