# MES Aerospazio - Manufacturing Execution System

Sistema di esecuzione della produzione per componenti aerospaziali, specializzato nella produzione di compositi in fibra di carbonio. Il sistema traccia ordini di lavorazione (ODL) attraverso i reparti di produzione utilizzando scansione di codici QR e ottimizzazione automatica dei lotti.

## Caratteristiche Principali

### 🏭 Gestione Produzione
- **Tracciamento ODL**: Monitoraggio completo degli ordini di lavorazione attraverso tutti i reparti
- **Sistema QR Code**: Generazione e scansione di codici QR per il tracciamento degli ODL
- **Flusso di Produzione**: Clean Room (Laminazione) → Autoclavi (Polimerizzazione) → NDI → Rifilatura
- **Workflow Automatico**: Trasferimento automatico degli ODL tra reparti con validazione

### 📱 Interfaccia Mobile-First
- **Scanner QR Offline**: Funzionalità di scansione offline con sincronizzazione automatica
- **Design Industriale**: Ottimizzato per smartphone in ambiente produttivo
- **Touch Targets**: Minimo 44px per utilizzo con guanti industriali

### 👥 Sistema di Autenticazione
- **Ruoli Multi-livello**: Ruoli globali (ADMIN, SUPERVISOR, OPERATOR) + ruoli di reparto
- **Gestione Password Completa**: Registrazione, login, cambio password, reset password
- **Protezione Route**: Tutte le route protette tramite middleware

### 🔧 Gestione Reparti e Turni
- **Reparti di Produzione**: Clean Room, Autoclavi, NDI, Rifilatura
- **Turni Standard**: 6-14, 14-22 con tracciamento supervisori di turno
- **Nomenclature Specifiche**: Codici parte specifici per ogni reparto

## Tecnologie Utilizzate

- **Next.js 15.3.4** con App Router e Turbopack
- **React 19.0.0** con TypeScript 5.x in modalità strict
- **Material-UI v7** con styling Emotion
- **NextAuth.js v5** con adapter Prisma e sessioni JWT
- **Prisma ORM 6.x** con database PostgreSQL
- **Validazione Zod** per type safety runtime
- **Architettura Ibrida**: Core monolitico Next.js + microservizi Python per algoritmi

## Avvio Rapido

### Prima Installazione
```bash
npm install
docker compose up -d
npm run db:push
npm run db:seed-complete
npm run dev
```

Credenziali di test (solo sviluppo locale):
- Admin: `admin@mantaaero.com / password123`
- Supervisor: `capo.cleanroom@mantaaero.com / password123`
- Operator: `op1.cleanroom@mantaaero.com / password123`

### Comandi Sviluppo
```bash
npm run dev          # Server di sviluppo con Turbopack
npm run dev -- -p 3001  # Specifica porta personalizzata
npm run build        # Build di produzione
npm run lint         # Controllo ESLint
npm run type-check   # Controllo TypeScript
```

### Database
```bash
docker compose up -d        # Avvia PostgreSQL e Redis
npm run db:generate         # Genera client Prisma
npm run db:push            # Applica modifiche schema (sviluppo)
npm run db:migrate         # Crea migrazioni (produzione)
npm run db:studio          # Apri Prisma Studio
npm run db:seed-complete   # Popola database con dati di test
```

### Setup Completo con Microservizi
```bash
# 1. Avvia infrastruttura
docker compose up -d
cd manta-optimization-service && docker compose -f docker-compose.dev.yml up -d && cd ..

# 2. Setup database
npm run db:push && npm run db:seed-complete

# 3. Configura ambiente
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local

# 4. Avvia Next.js
npm run dev -- -p 3001

# URL disponibili:
# - App: http://localhost:3001
# - Microservice: http://localhost:8000  
# - Ottimizzazione: http://localhost:3001/autoclavi/optimization
```

## Architettura

### Struttura del Progetto
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Pagine autenticazione
│   ├── (dashboard)/       # Dashboard principale
│   └── api/               # Route API
├── components/            # Sistema Atomic Design
├── domains/               # Domini business (DDD)
├── lib/                   # Infrastruttura core
├── services/              # Servizi API ed esterni
└── utils/                 # Utilità business
```

### Pattern Architetturali
- **Domain-Driven Design**: Organizzato per domini business
- **Atomic Design**: Gerarchia componenti UI (atoms → molecules → organisms)
- **Type Safety**: TypeScript end-to-end con validazione runtime

## Stato Attuale

### ✅ Funzionalità Implementate
- Sistema di autenticazione completo con ruoli multi-livello
- Gestione ODL con tracciamento attraverso i reparti
- Scanner QR con funzionalità offline
- Dashboard reparti con metriche produzione
- Workflow automatico trasferimento ODL
- Sistema amministrazione utenti e reparti
- Nomenclature specifiche per reparto

### 🚧 In Sviluppo
- Modulo NDI (Non-Destructive Inspection)
- Sistema di reportistica avanzata  
- Algoritmi di ottimizzazione autoclavi (microservizio Python)
- Pagine gestione per capi reparto e capi turno

### 📋 Prossimi Sviluppi
- Pagine amministrazione complete (`/admin/departments`, `/admin/settings`)
- Algoritmi di nesting 2D per ottimizzazione caricamento autoclavi
- Sistema di notifiche real-time
- Dashboard analitiche avanzate

## Conformità Aerospaziale

- **Tracciabilità Completa**: Tutti gli eventi di produzione registrati per audit trail
- **Standard Qualità**: Conformità agli standard di qualità aerospaziale
- **Formato ODL**: Codici parte alfanumerici unici (formato: 8G5350A0...)
- **Contesto Business Italiano**: UI in italiano, convenzioni manifatturiere italiane

## Note per Sviluppatori

Consultare `CLAUDE.md` per:
- Dettagli architetturali completi
- Standard di sviluppo e workflow
- Gestione multi-Claude e porte
- Protocolli pre-commit obbligatori
- Pattern specifici Material-UI v7
