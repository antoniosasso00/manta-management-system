# 📋 Comandi di Sviluppo MES Aerospazio

## Development Commands

### Next.js App
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run dev -- -p 3001  # Start on specific port
npm run build        # Create production build (does NOT start services)
npm run start        # Start production server (after build)
npm run lint         # Run ESLint checks
npm run type-check   # Type check without emitting files
```

### Database Management
```bash
# PostgreSQL + Redis
docker compose up -d           # Start database services
docker compose down            # Stop database services
docker compose ps             # Check services status
docker compose logs postgres  # View database logs

# Schema and Data
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema changes to database
npm run db:migrate             # Create and run migrations
npm run db:studio              # Open Prisma Studio GUI
npm run db:seed                # Seed basic data
npm run db:seed-complete       # Seed complete test data
```

### Microservices
```bash
# Optimization Service (Python)
cd manta-optimization-service
docker compose -f docker-compose.dev.yml up -d --build  # Start microservice
docker compose -f docker-compose.dev.yml down           # Stop microservice
docker compose -f docker-compose.dev.yml logs           # View logs
curl http://localhost:8000/api/v1/health/               # Test health
cd ..
```

## Complete System Startup

### Full Local Setup
```bash
# 1. Start infrastructure
docker compose up -d
cd manta-optimization-service && docker compose -f docker-compose.dev.yml up -d && cd ..

# 2. Setup database
npm run db:push && npm run db:seed-complete

# 3. Configure environment
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local

# 4. Start Next.js
npm run dev -- -p 3001
```

### URLs and Access
- **App**: http://localhost:3001
- **Microservice**: http://localhost:8000/docs
- **Optimization**: http://localhost:3001/autoclavi/optimization
- **Database Studio**: http://localhost:5555 (run `npm run db:studio`)

### Test Credentials
- **Email**: admin@mantaaero.com
- **Password**: password123

## Service Status Checks

### Health Checks
```bash
# Database
docker compose ps | grep postgres  # Should show "Up"

# Microservice
curl http://localhost:8000/api/v1/health/  # Should return {"status":"healthy"}

# Next.js
curl http://localhost:3001  # Should return HTML
```

### Debug Commands
```bash
# Database logs
docker compose logs -f postgres

# Microservice logs
docker logs manta-optimization-service-optimization-1 -f

# Next.js process
ps aux | grep "next dev"
```

## Troubleshooting

### Database Issues
```bash
# Reset database
docker compose down
docker compose up -d
npm run db:push
npm run db:seed-complete
```

### Microservice Issues
```bash
cd manta-optimization-service
docker compose -f docker-compose.dev.yml restart
docker compose -f docker-compose.dev.yml logs
```

### Next.js Issues
```bash
# Kill existing processes
pkill -f "next dev"

# Clear cache and restart
rm -rf .next
npm run dev -- -p 3001
```

### Port Conflicts
```bash
# Check what's using port
ss -tlnp | grep :3001
ss -tlnp | grep :8000

# Use different ports
npm run dev -- -p 3002  # Next.js on 3002
```

## Development Workflow

### Pre-commit Checks
```bash
npm run lint && npm run type-check
```

### Testing Integration
```bash
# Test microservice directly
curl -X POST http://localhost:8000/api/v1/optimization/batch \
  -H "Content-Type: application/json" \
  -d '{"odls": [], "autoclaves": [], "selected_cycles": []}'

# Test through Next.js API
curl -X POST http://localhost:3001/api/autoclavi/optimization/analyze \
  -H "Content-Type: application/json" \
  -d '{"odlIds": []}'
```

### Production Build Testing
```bash
# Build and test locally
npm run build
npm run start -- -p 3001

# Test production build
curl http://localhost:3001
```

