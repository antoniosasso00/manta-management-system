# Deployment del Microservizio di Ottimizzazione

Il microservizio Python **NON può essere ospitato su Netlify** poiché Netlify supporta solo siti statici e funzioni serverless JavaScript. Ecco le opzioni di deployment consigliate:

## 🚀 Opzioni di Deployment

### 1. Railway (Consigliato) ⭐
```bash
# 1. Installa Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inizializza progetto nella directory del microservizio
cd manta-optimization-service
railway init

# 4. Deploy
railway up

# 5. Ottieni URL del servizio
railway domain
```

**Vantaggi:**
- Deploy automatico da GitHub
- Supporto Python nativo
- Free tier disponibile ($5 crediti/mese)
- Variabili d'ambiente facili da gestire

### 2. Render
```bash
# 1. Crea account su render.com
# 2. Connetti repository GitHub
# 3. Crea nuovo "Web Service"
# 4. Seleziona branch e directory manta-optimization-service
# 5. Render detecta automaticamente Python e usa render.yaml
```

**Vantaggi:**
- Deploy automatico da GitHub
- Free tier (servizi dormono dopo 15 min inattività)
- SSL automatico

### 3. Fly.io
```bash
# 1. Installa Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Crea app
cd manta-optimization-service
fly launch

# 4. Deploy
fly deploy
```

**File fly.toml necessario:**
```toml
app = "mes-optimization"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"
```

### 4. Google Cloud Run (Serverless)
```bash
# 1. Crea Dockerfile
# 2. Build e push su Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/optimization-service

# 3. Deploy su Cloud Run
gcloud run deploy --image gcr.io/PROJECT-ID/optimization-service --platform managed
```

### 5. Heroku
```bash
# 1. Crea Procfile
echo "web: uvicorn api.main:app --host 0.0.0.0 --port $PORT" > Procfile

# 2. Crea runtime.txt
echo "python-3.11.0" > runtime.txt

# 3. Deploy
heroku create mes-optimization
git push heroku main
```

## 📝 Configurazione App Next.js

Dopo il deployment, aggiorna la variabile d'ambiente nell'app Next.js:

```env
# .env.production
NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL=https://your-service-url.railway.app/api/v1
```

## 🏗️ Architettura Consigliata

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Next.js App    │────▶│  Optimization    │────▶│   OR-Tools      │
│  (Netlify)      │     │  Service         │     │   Solver        │
│                 │     │  (Railway)       │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ▲                         │
        │                         │
        └─────────────────────────┘
         JSON Response via HTTPS
```

## 🔒 Sicurezza

1. **CORS Configuration**: Il microservizio è già configurato per accettare richieste dal dominio Netlify
2. **API Key** (opzionale): Aggiungi autenticazione API key per produzione
3. **Rate Limiting**: Considera l'aggiunta di rate limiting per prevenire abusi

## 💰 Costi Stimati

| Provider | Free Tier | Costo dopo Free Tier |
|----------|-----------|---------------------|
| Railway | $5 crediti/mese | ~$5-10/mese |
| Render | 750 ore/mese | $7/mese |
| Fly.io | 3 VM condivise | $1.94/mese per VM |
| Google Cloud Run | 2M richieste/mese | $0.00002400 per richiesta |

## 🚨 Monitoraggio

Tutti i provider suggeriti offrono:
- Logs in tempo reale
- Metriche CPU/memoria
- Health checks automatici
- Alert configurabili

## 📋 Checklist Deployment

- [ ] Scegli provider di hosting
- [ ] Configura variabili d'ambiente
- [ ] Testa connessione da app Next.js
- [ ] Configura monitoraggio
- [ ] Documenta URL del servizio
- [ ] Aggiorna CLAUDE.md con info deployment

## 🔧 Troubleshooting

### Il servizio non risponde
1. Verifica logs del provider
2. Controlla health endpoint: `GET /api/v1/health`
3. Verifica CORS configuration

### Errore di connessione da Next.js
1. Verifica URL in variabili d'ambiente
2. Controlla HTTPS certificato
3. Verifica CORS origins

### Performance lenta
1. Aumenta risorse (CPU/RAM)
2. Abilita caching Redis
3. Ottimizza timeout solver