# 🚀 MES Aerospazio - Script di Avvio

## Script Unificato di Gestione

Lo script `start.sh` gestisce completamente l'avvio e la gestione dell'applicazione MES Aerospazio.

## 📋 Prerequisiti

- **Node.js 18+**
- **npm**
- **Docker** e **Docker Compose** (per modalità Docker)

## 🎯 Utilizzo

### Menu Interattivo (Raccomandato)
```bash
./scripts/start.sh
```

### Comandi Diretti
```bash
# Primo avvio
./scripts/start.sh setup

# Modalità sviluppo
./scripts/start.sh dev

# Modalità produzione  
./scripts/start.sh prod

# Docker completo
./scripts/start.sh docker

# Utility
./scripts/start.sh status
./scripts/start.sh clean
./scripts/start.sh help
```

## 🎮 Modalità Disponibili

### 1. 💻 Modalità Sviluppo
- Avvia DB e Redis con Docker
- Server Next.js in modalità dev
- Hot reload attivo
- **Porta**: 3000

### 2. 🏭 Modalità Produzione
- Build ottimizzato dell'applicazione
- Server Next.js in modalità start
- Performance massime
- **Porta**: 3000

### 3. 🐳 Docker Completo
- Tutti i servizi in container
- Isolamento completo
- Facile deployment
- **Porte**: 3000, 5432, 6379

### 4. 🗄️ Solo Servizi
- PostgreSQL e Redis via Docker
- App Next.js manuale
- Sviluppo ibrido

### 5. 🚀 Setup Iniziale
- Verifica prerequisiti
- Crea `.env.local`
- Installa dipendenze
- Configura database

## 🔧 Utility

### 📊 Status Servizi
```bash
./scripts/start.sh status
```
Mostra stato porte e container Docker.

### 🧹 Pulizia Risorse
```bash
./scripts/start.sh clean
```
Termina processi e libera risorse.

### 📖 Guida
```bash
./scripts/start.sh help
```
Mostra guida completa comandi.

## 🌐 Accesso Applicazione

- **App**: http://localhost:3000
- **Registrazione**: http://localhost:3000/register
- **Admin**: http://localhost:3000/admin/users

## ✨ Caratteristiche

- 🎨 **Interface colorata** e user-friendly
- 🔍 **Controlli automatici** prerequisiti
- ⚡ **Gestione conflitti** porte
- 🐳 **Integrazione Docker** completa
- 🛡️ **Gestione errori** robusta
- 📊 **Monitoring status** servizi
- 🧹 **Cleanup automatico** risorse

## 🔄 Workflow Tipico

```bash
# Prima volta
./scripts/start.sh setup

# Sviluppo quotidiano
./scripts/start.sh
# Seleziona opzione 1 (Sviluppo)

# Fine sessione
./scripts/start.sh clean
```

## 🔑 Primo Utente

1. Avvia l'applicazione
2. Vai su http://localhost:3000/register
3. Registra il primo utente
4. Diventa automaticamente **ADMIN**
5. Gestisci altri utenti dal pannello admin

## 🆘 Risoluzione Problemi

### Porte occupate
```bash
./scripts/start.sh clean
./scripts/start.sh dev
```

### Reset completo
```bash
./scripts/start.sh clean
docker-compose down -v
./scripts/start.sh setup
```

### Verifica status
```bash
./scripts/start.sh status
```

---

**Happy Coding! 🚀**