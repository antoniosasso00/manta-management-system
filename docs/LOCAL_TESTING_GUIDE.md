# 🧪 Guida Test Locale Completo

## Architettura Locale

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  LOCALHOST:3001 │    │  LOCALHOST:8000 │    │  LOCALHOST:5432 │
│                 │    │                 │    │                 │
│ Next.js MES App │◄──►│ Python Services │◄──►│ PostgreSQL DB   │
│                 │    │                 │    │                 │
│ - Frontend      │    │ - Optimization  │    │ - Docker DB     │
│ - API Routes    │    │ - OR-Tools      │    │ - Prisma        │
│ - Dev Server    │    │ - FastAPI       │    │ - Test Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Database Setup (Docker)

```bash
# Nel progetto principale
cd /home/antonio/Scrivania/manta-management-system

# Avvia PostgreSQL e Redis
docker compose up -d

# Verifica database
docker compose ps
# Dovresti vedere postgres e redis running
```

## 2. Database Schema e Dati Test

```bash
# Applica schema
npm run db:push

# Carica dati di test completi
npm run db:seed-complete

# Verifica connessione
npm run db:studio
# Apri http://localhost:5555 per vedere i dati
```

## 3. Microservizio Python Setup

```bash
# Vai nella directory microservizio
cd manta-optimization-service

# Opzione A: Docker (Raccomandato - Zero config)
docker compose -f docker-compose.dev.yml up -d

# Opzione B: Python Nativo (se hai risolto i problemi pip)
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
# python api/main.py

# Verifica microservizio
curl http://localhost:8000/api/v1/health/
# Dovresti vedere: {"status":"healthy",...}
```

## 4. Next.js App Setup

```bash
# Torna al progetto principale  
cd ..

# Configura variabile ambiente per microservizio
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local

# Avvia Next.js
npm run dev -- -p 3001

# Verifica app
curl http://localhost:3001
# Dovresti vedere l'app Next.js
```

## 5. Test Integrazione Completa

### Test 1: Health Check Generale
```bash
# Database
docker compose ps | grep postgres
# Output: manta-management-system-postgres-1 running

# Microservizio
curl -s http://localhost:8000/api/v1/health/ | grep healthy
# Output: "status":"healthy"

# Next.js
curl -s http://localhost:3001/api/health | head -1
# Output: status 200 OK
```

### Test 2: API Optimization Integration
```bash
# Test diretto al microservizio
curl -X POST http://localhost:8000/api/v1/optimization/batch \
  -H "Content-Type: application/json" \
  -d '{
    "odls": [{
      "id": "test-1",
      "odl_number": "2024-001", 
      "curing_cycle": "CICLO_A",
      "tools": [{"id": "T1", "length": 500, "width": 300, "height": 100}]
    }],
    "autoclaves": [{"id": "AC1", "name": "Autoclave 1", "width": 2000, "height": 1500}],
    "selected_cycles": ["CICLO_A"]
  }'
```

### Test 3: Frontend Integration
```bash
# Apri browser e vai a:
http://localhost:3001/autoclavi/optimization

# Oppure test API Next.js
curl -X POST http://localhost:3001/api/autoclavi/optimization/analyze \
  -H "Content-Type: application/json" \
  -d '{"odlIds": ["test-id"]}'
```

## 6. Workflow Test Completo

### Step 1: Dati di Test
```bash
# Assicurati di avere dati seed
npm run db:seed-complete

# Verifica dati nel database
npm run db:studio
# Controlla tabelle: ODL, Part, Tool, Autoclave
```

### Step 2: Test UI End-to-End
1. **Apri**: http://localhost:3001
2. **Login**: admin@mantaaero.com / password123  
3. **Vai a**: Autoclavi → Ottimizzazione Batch
4. **Testa wizard**:
   - Selezione ODL
   - Analisi cicli di cura  
   - Configurazione supporti rialzati
   - Esecuzione ottimizzazione

### Step 3: Debug e Logs
```bash
# Logs microservizio
docker logs manta-optimization-service-optimization-1 -f

# Logs Next.js (nella console dove hai lanciato npm run dev)

# Logs database
docker logs manta-management-system-postgres-1
```

## 7. Troubleshooting Comune

### Microservizio non risponde
```bash
# Controlla container
docker compose -f manta-optimization-service/docker-compose.dev.yml ps

# Rebuild se necessario
docker compose -f manta-optimization-service/docker-compose.dev.yml down
docker compose -f manta-optimization-service/docker-compose.dev.yml up -d --build
```

### Next.js errori API
```bash
# Controlla environment
cat .env.local | grep OPTIMIZATION_SERVICE_URL
# Deve essere: OPTIMIZATION_SERVICE_URL=http://localhost:8000

# Restart Next.js
# Ctrl+C e poi npm run dev -- -p 3001
```

### Database connection issues
```bash
# Controlla PostgreSQL
docker compose ps postgres
docker compose logs postgres

# Reset database se necessario
docker compose down
docker compose up -d
npm run db:push
npm run db:seed-complete
```

## 8. Performance Testing

### Load Test Microservizio
```bash
# Install ab (apache bench)
sudo apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:8000/api/v1/health/
```

### Memory/CPU Monitoring
```bash
# Monitor Docker containers
docker stats

# Monitor Node.js process
top -p $(pgrep -f "next dev")
```

## 9. Quick Reset (Se qualcosa va storto)

```bash
# Reset completo ambiente
cd /home/antonio/Scrivania/manta-management-system

# Stop tutto
docker compose down
cd manta-optimization-service && docker compose -f docker-compose.dev.yml down
cd ..

# Clean e restart
docker system prune -f
docker compose up -d
npm run db:push
npm run db:seed-complete

cd manta-optimization-service
docker compose -f docker-compose.dev.yml up -d --build
cd ..

npm run dev -- -p 3001
```

## ✅ Checklist Test Locale

- [ ] ✅ PostgreSQL running (docker compose ps)
- [ ] ✅ Database schema updated (npm run db:push)  
- [ ] ✅ Test data loaded (npm run db:seed-complete)
- [ ] ✅ Microservizio Python running (curl localhost:8000/api/v1/health/)
- [ ] ✅ Next.js app running (curl localhost:3001)
- [ ] ✅ Environment OPTIMIZATION_SERVICE_URL configurato
- [ ] ✅ Login funzionante (admin@mantaaero.com)
- [ ] ✅ Wizard ottimizzazione accessibile (/autoclavi/optimization)
- [ ] ✅ Test end-to-end completato

## 🎯 Risultato

Sistema MES completo funzionante in locale con:
- Database PostgreSQL con dati test
- Microservizio ottimizzazione con OR-Tools
- App Next.js con integrazione completa
- Wizard ottimizzazione autoclavi funzionante