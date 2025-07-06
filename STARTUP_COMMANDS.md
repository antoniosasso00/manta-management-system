# 🚀 Comandi Startup Sistema Completo

## Opzione A: Script Automatico (RACCOMANDATO)

```bash
./start-all-local.sh
```

**Questo script fa tutto automaticamente:**
- ✅ Avvia database (PostgreSQL + Redis)
- ✅ Avvia microservizio Python
- ✅ Configura schema database
- ✅ Carica dati test
- ✅ Configura environment
- ✅ Avvia Next.js su porta 3001

## Opzione B: Manuale Step-by-Step

### 1. Database
```bash
docker compose up -d
npm run db:push
npm run db:seed-complete
```

### 2. Microservizio Python
```bash
cd manta-optimization-service
docker compose -f docker-compose.dev.yml up -d
cd ..
```

### 3. Next.js App
```bash
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local
npm run dev -- -p 3001
```

## Opzione C: Build Produzione Locale

### 1. Build
```bash
npm run build
```

### 2. Start Produzione
```bash
npm run start -- -p 3001
```

## 🔍 Verifica Sistema

### Check Database
```bash
docker compose ps
# Dovresti vedere postgres e redis "Up"
```

### Check Microservizio
```bash
curl http://localhost:8000/api/v1/health/
# Output: {"status":"healthy",...}
```

### Check Next.js
```bash
curl http://localhost:3001
# Output: HTML della homepage
```

## 📍 URLs Test

- **App MES**: http://localhost:3001
- **Ottimizzazione**: http://localhost:3001/autoclavi/optimization  
- **Microservizio Docs**: http://localhost:8000/docs
- **Database Studio**: http://localhost:5555 (run `npm run db:studio`)

## 🔑 Login Test

- **Email**: admin@mantaaero.com
- **Password**: password123

## ⚠️ Troubleshooting

### Next.js non si avvia
```bash
# Kill processi esistenti
pkill -f "next dev"
# Riavvia
npm run dev -- -p 3001
```

### Microservizio errori
```bash
cd manta-optimization-service
docker compose -f docker-compose.dev.yml logs
docker compose -f docker-compose.dev.yml restart
```

### Database errori
```bash
docker compose down
docker compose up -d
npm run db:push
npm run db:seed-complete
```