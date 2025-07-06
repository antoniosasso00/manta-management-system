# Deployment Microservizio Ottimizzazione

## ⚠️ IMPORTANTE: Netlify NON Supporta Python

Netlify supporta solo:
- Siti statici (HTML/CSS/JS)
- Funzioni serverless JavaScript/TypeScript
- **NON supporta** applicazioni Python/FastAPI

## 🚀 Soluzioni di Deployment Consigliate

### Opzione 1: Railway (Consigliato per semplicità)

1. **Setup iniziale:**
```bash
# Installa CLI
npm install -g @railway/cli

# Login
railway login

# Nella directory del microservizio
cd manta-optimization-service
railway init
```

2. **Deploy:**
```bash
railway up
```

3. **Ottieni URL pubblico:**
```bash
railway domain
```

4. **Aggiorna app Next.js:**
```env
# .env.production
NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL=https://your-app.railway.app/api/v1
```

### Opzione 2: Render (Free tier con limitazioni)

1. Connetti GitHub su render.com
2. Crea nuovo "Web Service"
3. Punta a `manta-optimization-service/`
4. Render usa automaticamente `render.yaml`

### Opzione 3: Deploy Locale per Development

Se preferisci mantenere il servizio locale durante lo sviluppo:

1. **Usa ngrok per esporre localhost:**
```bash
# Installa ngrok
npm install -g ngrok

# Avvia microservizio
cd manta-optimization-service
./run.sh

# In altro terminale, esponi porta 8000
ngrok http 8000
```

2. **Usa URL ngrok in app:**
```env
NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL=https://xyz123.ngrok.io/api/v1
```

## 📋 Checklist Pre-Deploy

- [ ] Installa dipendenze: `pip install -r requirements.txt`
- [ ] Testa localmente: `python3 test_simple.py`
- [ ] Verifica variabili ambiente in `.env`
- [ ] Configura CORS per dominio Netlify

## 🔧 Configurazione Produzione

### Variabili Ambiente Richieste

```env
# Nel servizio Python
CORS_ORIGINS=["https://your-app.netlify.app","https://your-domain.com"]
SOLVER_THREADS=4
SOLVER_TIME_LIMIT_MS=60000

# Nell'app Next.js
NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL=https://your-optimization-service.railway.app/api/v1
```

### Sicurezza

1. **Aggiungi API Key (opzionale):**
```python
# In core/config.py
api_key: str = Field(default="", env="API_KEY")

# In middleware
if settings.api_key and request.headers.get("X-API-Key") != settings.api_key:
    raise HTTPException(401)
```

2. **Rate Limiting:**
```python
from slowapi import Limiter
limiter = Limiter(key_func=lambda: request.client.host)
app.state.limiter = limiter

@app.post("/optimization/execute")
@limiter.limit("10/minute")
async def execute_optimization(request: Request):
    ...
```

## 🏗️ Architettura in Produzione

```
┌─────────────────────┐       ┌───────────────────┐       ┌──────────────┐
│   Next.js App       │       │   Optimization    │       │  PostgreSQL  │
│   (Netlify)         │──────▶│   Service         │       │  (Neon)      │
│                     │ HTTPS │   (Railway)       │       │              │
│ - Frontend React    │       │                   │       │              │
│ - API Routes        │       │ - FastAPI         │       │              │
│ - Auth             │       │ - OR-Tools        │◀──────│              │
└─────────────────────┘       │ - Algorithms      │ Read  └──────────────┘
                              └───────────────────┘ Only

```

## 🚨 Monitoraggio

### Railway Metrics
- CPU/Memory usage
- Request count
- Response times
- Error logs

### Health Check
```bash
curl https://your-service.railway.app/api/v1/health
```

### Logs
```bash
railway logs
```

## 💰 Costi

| Servizio | App Next.js | Microservizio | Database |
|----------|-------------|---------------|----------|
| Provider | Netlify | Railway | Neon |
| Free Tier | 100GB/mese | $5 crediti | 3GB storage |
| Costo dopo | $19/mese | ~$5-10/mese | $19/mese |

**Totale stimato:** $0-50/mese in base al traffico

## 📝 Note Finali

1. Il microservizio è **stateless** - può scalare orizzontalmente
2. I risultati sono cachati temporaneamente in memoria
3. Per produzione, considera Redis per cache persistente
4. OR-Tools richiede ~500MB RAM minimo

## 🆘 Troubleshooting

**"Connection refused"**
- Verifica che il servizio sia running
- Controlla URL nelle variabili ambiente
- Verifica CORS settings

**"Timeout"**
- Aumenta `SOLVER_TIME_LIMIT_MS`
- Riduci numero ODL per batch
- Considera worker background per job lunghi

**"Out of memory"**
- Aumenta RAM del container
- Limita `SOLVER_THREADS`
- Implementa paginazione risultati