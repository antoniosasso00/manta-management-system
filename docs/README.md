# MES Aerospazio - Documentazione

Sistema MES (Manufacturing Execution System) per il monitoraggio e gestione del flusso produttivo di componenti aeronautici in fibra di carbonio.

## 📚 Documentazione Principale

### [REQUIREMENTS.md](./REQUIREMENTS.md)
Requisiti di sistema completi, stakeholders, vincoli e fasi di implementazione.

### [MVP_DEFINITION.md](./MVP_DEFINITION.md) 
Definizione MVP con roadmap funzione-per-funzione e criteri di successo.

### [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)
Timeline di sviluppo settimanale e roadmap post-MVP per sistema completo.

### [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
Architettura tecnica, stack tecnologico, pattern di design e deployment.

## 🛠️ Guide Implementative

### [Implementations/AUTHENTICATION_IMPLEMENTATION.md](./Implementations/AUTHENTICATION_IMPLEMENTATION.md)
Sistema di autenticazione completo con NextAuth.js, ruoli, e gestione password.

### [Implementations/QR_SYSTEM_IMPLEMENTATION.md](./Implementations/QR_SYSTEM_IMPLEMENTATION.md)
Sistema QR Code per tracciamento ODL: generazione, scansione, validazione.

### [Implementations/AUTOCLAVE_OPTIMIZATION_IMPLEMENTATION.md](./Implementations/AUTOCLAVE_OPTIMIZATION_IMPLEMENTATION.md)
Algoritmo di ottimizzazione batch autoclavi con visualizzazione 2D.

## 🚀 Quick Start

### Primo Setup
```bash
npm install
docker-compose up -d
npm run db:push
npm run dev
```

### Comandi Principali
```bash
npm run dev          # Sviluppo con Turbopack
npm run build        # Build produzione
npm run db:generate  # Genera Prisma client
npm run db:studio    # GUI database
```

## 📁 Struttura Progetto

```
/docs/
├── README.md                    # Questo file
├── REQUIREMENTS.md              # Requisiti di sistema
├── MVP_DEFINITION.md            # MVP + roadmap funzionale
├── DEVELOPMENT_ROADMAP.md       # Timeline sviluppo
├── TECHNICAL_ARCHITECTURE.md   # Architettura tecnica
└── Implementations/             # Guide implementative
    ├── AUTHENTICATION_IMPLEMENTATION.md
    ├── QR_SYSTEM_IMPLEMENTATION.md
    └── AUTOCLAVE_OPTIMIZATION_IMPLEMENTATION.md
```

## 🎯 Status Sviluppo

**Fase Attuale**: Authentication & Core Infrastructure Complete
- ✅ Next.js 15.3.4 + TypeScript + Material-UI v7
- ✅ NextAuth.js v5 con gestione ruoli dipartimentali  
- ✅ Database Prisma con schema completo (19 tabelle)
- ✅ API Routes per auth, admin, ODL, parts, departments
- ✅ Docker development environment
- 🚧 UI Components per Part/ODL management
- 🔄 Componenti QR scanning e tracciamento eventi

## 📖 Convenzioni

- **Lingua**: Documentazione e UI in italiano
- **Commit**: Messaggi descrittivi con emoji appropriati
- **Code Style**: TypeScript strict, ESLint, atomic design
- **Testing**: Unit test per services, E2E per workflow

## 🔍 Link Utili

- **Prisma Studio**: http://localhost:5555 (con `npm run db:studio`)
- **App Development**: http://localhost:3000 (con `npm run dev`)
- **Database**: PostgreSQL su porta 5432 (Docker)
- **Redis**: Cache/queue su porta 6379 (Docker)

---

Per domande o chiarimenti, consultare la documentazione specifica o aprire un issue nel repository.