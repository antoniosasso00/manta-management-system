# MES Aerospazio - Development Setup

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the database**
   ```bash
   docker-compose up -d
   ```

3. **Setup the database schema**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to http://localhost:3000

## First Steps

1. **Create your first user**
   - Visit http://localhost:3000/register
   - Create an account (will be assigned OPERATOR role by default)

2. **Login**
   - Visit http://localhost:3000/login
   - Use your credentials to access the system

## Environment Variables

Copy `.env.local` and update the values:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mes_aerospazio"

# NextAuth
NEXTAUTH_SECRET="your-development-secret-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Redis for BullMQ
REDIS_URL="redis://localhost:6379"

# Gamma MES Integration
GAMMA_SYNC_FOLDER="/path/to/gamma/exports"

# Environment
NODE_ENV="development"
```

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio GUI

### Docker
- `docker-compose up -d` - Start PostgreSQL and Redis
- `docker-compose down` - Stop services
- `docker-compose logs postgres` - View database logs

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application
│   ├── api/               # API routes
│   └── production/        # Production modules
├── components/            # Atomic Design System
│   ├── atoms/            # Basic UI elements
│   ├── molecules/        # Component combinations  
│   ├── organisms/        # Complex sections
│   └── templates/        # Page layouts
├── domains/              # DDD business domains
│   ├── production/       # Core domain: ODL tracking
│   ├── planning/         # Autoclave optimization
│   └── user/             # Authentication
├── hooks/                # Custom React hooks
├── lib/                  # Configuration (Prisma, Auth)
├── services/             # API layer
├── stores/               # Zustand state stores
└── utils/                # Shared utilities
```

## Implementation Status

✅ **Foundation Complete**
- Next.js 15.3.4 with TypeScript
- Material-UI v7 with custom theme
- NextAuth.js authentication
- Prisma ORM with PostgreSQL
- Docker development environment
- Zod validation schemas
- Atomic Design component structure

🚧 **Next Phase**
- ODL management CRUD operations
- QR code generation and scanning
- Clean Room module
- Autoclave optimization algorithm
- Department management

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint 9 with flat config
- Mobile-first design (44px touch targets)
- Material-UI component wrapping for consistency

### Database
- All changes via Prisma migrations
- Use Zod schemas for validation
- Audit trail for all production operations

### Authentication
- JWT-based sessions
- Role-based access control (ADMIN, SUPERVISOR, OPERATOR)
- Protected routes via middleware

### Business Logic
- Domain-driven design patterns
- Service layer for complex operations
- Event-driven architecture for production tracking

## Troubleshooting

### Database Connection Issues
```bash
# Check if containers are running
docker-compose ps

# Restart database
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Prisma Issues
```bash
# Reset database (WARNING: loses data)
npx prisma db push --force-reset

# Generate client after schema changes
npm run db:generate
```

### Authentication Issues
- Check NEXTAUTH_SECRET is set
- Verify database connection
- Check if user table exists: `npm run db:studio`