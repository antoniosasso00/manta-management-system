# 🚀 Quick Deploy Railway - 5 Minuti

## Step 1: Prepara Repository Microservizio

```bash
cd manta-optimization-service

# Crea repository Git separato
git init
git add .
git commit -m "feat: microservizio ottimizzazione autoclavi"

# Opzione A: Nuovo repository GitHub
# - Vai su github.com/new
# - Nome: manta-optimization-service
# - Copia comandi git remote add origin

# Opzione B: Sottocartella nel repo esistente
# Railway può deployare da subfolder
```

## Step 2: Deploy su Railway

1. **Vai su [railway.app](https://railway.app)**
2. **Login con GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Seleziona repository** (o subfolder)
5. **Railway detecta automaticamente Python**

## Step 3: Environment Variables Railway

Nel dashboard Railway, vai su **Variables** e aggiungi:

```env
PORT=8000
ENVIRONMENT=production
CORS_ORIGINS=["https://peaceful-bombolone-b1f862.netlify.app"]
```

## Step 4: Aggiorna Netlify

Nel dashboard Netlify, vai su **Environment Variables** e aggiungi:

```env
OPTIMIZATION_SERVICE_URL=https://your-railway-url.up.railway.app
```

## Step 5: Test Completo

```bash
# 1. Aspetta deploy Railway (2-3 minuti)
# 2. Copia URL Railway dal dashboard
# 3. Test health check:
curl https://your-railway-url.up.railway.app/api/v1/health/

# 4. Aggiorna ENV su Netlify
# 5. Test integrazione:
# Vai su https://your-netlify-url.netlify.app/autoclavi/optimization
```

## ⚡ URLs di Esempio

- **Netlify**: `https://peaceful-bombolone-b1f862.netlify.app`
- **Railway**: `https://manta-optimization-production.up.railway.app`
- **Health Check**: `https://manta-optimization-production.up.railway.app/api/v1/health/`
- **Docs**: `https://manta-optimization-production.up.railway.app/docs`

## 🎯 Risultato Finale

✅ App MES completa su Netlify  
✅ Microservizio Python su Railway  
✅ Database PostgreSQL su Neon  
✅ Integrazione completa funzionante  
✅ Costo: ~$5/mese  

**Tempo totale**: 5-10 minuti