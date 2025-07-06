# Guida Deploy Completo MES + Microservizi

## Architettura di Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NETLIFY       │    │    RAILWAY      │    │   SUPABASE      │
│                 │    │                 │    │                 │
│ Next.js MES App │◄──►│ Python Services │◄──►│ PostgreSQL DB   │
│                 │    │                 │    │                 │
│ - Frontend      │    │ - Optimization  │    │ - Production DB │
│ - API Routes    │    │ - Future μSvcs  │    │ - Backup        │
│ - Static Assets │    │ - OR-Tools      │    │ - Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Deploy Next.js su Netlify (FATTO ✅)

L'app principale è già su Netlify. Assicurati di avere:

```bash
# Variabili d'ambiente Netlify
DATABASE_URL=postgresql://...  # Supabase connection
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.netlify.app
OPTIMIZATION_SERVICE_URL=https://your-microservice.railway.app
```

## 2. Deploy Microservizio Python su Railway

### Step 1: Prepara il Repository

```bash
# Crea repository separato per il microservizio
cd manta-optimization-service
git init
git add .
git commit -m "feat: initial microservice setup"

# Push su GitHub (nuovo repo o branch)
git remote add origin https://github.com/your-username/manta-optimization-service
git push -u origin main
```

### Step 2: Railway Setup

1. **Vai su [railway.app](https://railway.app)**
2. **Collega GitHub** e seleziona il repo `manta-optimization-service`
3. **Railway detecta automaticamente** Python e usa il `railway.json`
4. **Environment Variables** da configurare:
   ```
   PORT=8000
   ENVIRONMENT=production
   CORS_ORIGINS=["https://your-app.netlify.app"]
   ```

### Step 3: Configurazione Automatica

Railway userà automaticamente:
- `railway.json` per la configurazione
- `requirements.txt` per le dipendenze
- `Dockerfile` se presente

## 3. Aggiorna Configurazione Next.js

```typescript
// src/services/optimization-service.ts
const OPTIMIZATION_SERVICE_URL = 
  process.env.OPTIMIZATION_SERVICE_URL || 
  'https://your-microservice.railway.app';
```

## 4. Database Setup (Opzionale - Upgrade)

Se vuoi upgrader da Neon a Supabase per migliori performance:

```bash
# 1. Esporta schema da Neon
npx prisma db pull

# 2. Setup Supabase
# - Crea progetto su supabase.com
# - Copia connection string
# - Aggiorna DATABASE_URL su Netlify

# 3. Migra dati
npx prisma db push
npm run db:seed-complete  # Solo in staging/development
```

## 5. Testing Deploy

```bash
# Test health check microservizio
curl https://your-microservice.railway.app/api/v1/health/

# Test integrazione completa
# Vai su https://your-app.netlify.app/autoclavi/optimization
```

## 6. Monitoring e Scaling

### Railway Monitoring
- CPU/Memory usage automatico
- Logs in real-time
- Scaling automatico sotto carico

### Netlify Analytics
- Build times e deploy status
- Edge function performance
- Bandwidth usage

## 7. Costi Stimati

```
Netlify (Next.js):     GRATUITO (fino a 100GB bandwidth)
Railway (Python):      $5/mese (con crediti gratuiti iniziali)
Neon/Supabase (DB):    GRATUITO (piano hobby)
                       
TOTALE: ~$5/mese
```

## 8. Alternative Complete

### Opzione A: Vercel + Railway (Premium)
- Vercel Pro: $20/mese
- Railway: $5/mese
- **Pro**: Migliori performance, analytics avanzate
- **Contro**: Più costoso

### Opzione B: DigitalOcean App Platform (All-in-One)
- $12/mese per entrambi i servizi
- **Pro**: Tutto in un provider
- **Contro**: Meno feature specializzate

### Opzione C: AWS/GCP (Enterprise)
- Costi variabili (scalabilità infinita)
- **Pro**: Massima flessibilità
- **Contro**: Complessità gestione

## 9. Deploy Automation

```yaml
# .github/workflows/deploy-microservice.yml
name: Deploy Microservice
on:
  push:
    branches: [main]
    paths: ['manta-optimization-service/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway-github-action@v1
        with:
          api_token: ${{ secrets.RAILWAY_API_TOKEN }}
```

## ⚡ Quick Start (5 minuti)

1. **Railway Account**: Signup su railway.app
2. **Connect GitHub**: Autorizza accesso al repo
3. **Deploy**: Seleziona `manta-optimization-service` folder
4. **Environment**: Aggiungi `CORS_ORIGINS` con URL Netlify
5. **Update Next.js**: Aggiungi `OPTIMIZATION_SERVICE_URL` su Netlify
6. **Test**: Vai su `/autoclavi/optimization` nella tua app

🎯 **Risultato**: App completa con microservizi funzionanti in produzione!