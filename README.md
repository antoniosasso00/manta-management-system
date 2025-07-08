# MES Aerospazio - Manufacturing Execution System

Sistema MES (Manufacturing Execution System) completo per la produzione di componenti aerospaziali in fibra di carbonio. Sviluppato con Next.js 15, TypeScript e architettura Domain-Driven Design.

## 🚀 Panoramica

MES Aerospazio è una soluzione enterprise per il tracking real-time della produzione aerospaziale, specializzata nella lavorazione di compositi in fibra di carbonio. Il sistema integra:

- **Tracking QR Code**: Sistema completo di generazione e scansione QR per ODL (Ordini Di Lavoro)
- **Workflow Automatici**: Trasferimento automatico ODL tra reparti con validazioni
- **Ottimizzazione AI**: Algoritmi di bin packing 2D per batch autoclavi
- **Controllo Qualità**: Sistema integrato di ispezioni e non conformità
- **Multi-tenant**: Gestione ruoli e permessi multi-livello
- **Offline-First**: Scanner QR funzionante offline con sync automatico

## 📋 Indice

- [Requisiti](#requisiti)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Architettura](#architettura)
- [Funzionalità](#funzionalità)
- [Utilizzo](#utilizzo)
- [API Documentation](#api-documentation)
- [Sviluppo](#sviluppo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

## 📦 Requisiti

- Node.js 20+ 
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose
- npm 10+

## 🛠️ Installazione

### Setup Rapido (Prima Installazione)

```bash
# 1. Clona il repository
git clone https://github.com/mantaaero/mes-aerospazio.git
cd mes-aerospazio

# 2. Installa dipendenze
npm install

# 3. Avvia servizi Docker
docker compose up -d

# 4. Setup database
npm run db:push

# 5. Avvia applicazione
npm run dev

# 6. Apri http://localhost:3000 e vai su /register per creare primo utente
```

### Setup Completo (Con Dati Test)

```bash
# 1. Avvia infrastruttura completa
docker compose up -d
cd manta-optimization-service && docker compose -f docker-compose.dev.yml up -d && cd ..

# 2. Setup database con dati test
npm run db:push && npm run db:seed-complete

# 3. Configura microservizio
echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local

# 4. Avvia applicazione
npm run dev

# Login test: admin@mantaaero.com / password123
```

## ⚙️ Configurazione

### Variabili Ambiente (.env.local)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/mes_aerospazio"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-key-here"

# Email (opzionale)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@mantaaero.com"

# Redis
REDIS_URL="redis://localhost:6379"

# Microservices
OPTIMIZATION_SERVICE_URL="http://localhost:8000"
```

## 🏗️ Architettura

### Stack Tecnologico

- **Frontend**: Next.js 15.3.4, React 19, Material-UI v7
- **Backend**: Next.js API Routes, Prisma ORM 6.x
- **Database**: PostgreSQL 16, Redis 7
- **Authentication**: NextAuth.js v5 con JWT
- **Microservizi**: Python/FastAPI per ottimizzazione
- **Deployment**: Netlify con Neon PostgreSQL

### Struttura Progetto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Pagine autenticazione
│   ├── (dashboard)/       # Area principale app
│   ├── api/               # API endpoints
│   └── layout.tsx         # Root layout
├── components/            # Atomic Design System
│   ├── atoms/             # Componenti base
│   ├── molecules/         # Componenti composti
│   ├── organisms/         # Componenti complessi
│   └── templates/         # Layout pagine
├── domains/               # Domini DDD
│   ├── core/             # Parti, ODL, Strumenti
│   ├── production/       # Tracking produzione
│   ├── autoclave/        # Gestione autoclavi
│   ├── quality/          # Controllo qualità
│   └── user/             # Gestione utenti
├── lib/                   # Infrastruttura
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Database client
│   └── theme.ts          # Material-UI theme
├── services/              # Servizi esterni
├── utils/                 # Utilities
└── middleware.ts          # Route protection
```

### Pattern Architetturali

- **Domain-Driven Design**: Organizzazione per domini business
- **Atomic Design**: Gerarchia componenti UI strutturata
- **Service Layer**: Tutti i servizi con metodi statici
- **Repository Pattern**: Accesso dati tramite Prisma
- **DTO Pattern**: Validazione con Zod schemas

## 🎯 Funzionalità

### 1. Sistema QR Code

- **Generazione**: QR univoci per ogni ODL con dati embedded
- **Scanner Mobile**: WebRTC scanner ottimizzato per smartphone industriali
- **Offline Mode**: Funziona senza connessione con cache locale
- **Auto-Sync**: Sincronizzazione automatica quando online

### 2. Tracking Produzione

- **Real-time**: Eventi entry/exit istantanei
- **Timeline**: Storico completo movimenti ODL
- **KPI Dashboard**: Metriche performance per reparto
- **Analisi Tempi**: Tempi ciclo, lead time, efficienza

### 3. Gestione ODL (Ordini Di Lavoro)

- **CRUD Completo**: Creazione, modifica, cancellazione
- **Stati ODL**: PIANIFICATO → IN_PRODUZIONE → COMPLETATO
- **Assegnazione Reparti**: Manuale o automatica via workflow
- **Priorità**: Alta, Media, Bassa con ordinamento

### 4. Reparti Produzione

Ogni reparto ha configurazioni specifiche:

- **Clean Room**: Sequenze laminazione, tipo resina, tempo ciclo
- **Autoclavi**: Cicli cura, linee vacuum, temperatura/pressione
- **NDI**: Metodi ispezione, criteri accettazione
- **Controllo Numerico**: Programmi CNC, tempo setup
- **Montaggio**: Sequenze assemblaggio, componenti
- **Verniciatura**: Tipo vernice, strati, tempo asciugatura
- **Honeycomb**: Tipo core, dimensioni celle
- **Motori**: Configurazioni motore, test richiesti

### 5. Ottimizzazione Batch Autoclavi

- **Algoritmo 2D Bin Packing**: Massimizza utilizzo spazio
- **Compatibilità Cicli**: Raggruppa ODL con cicli cura simili
- **Gestione Strumenti**: Considera altezza strumenti elevati
- **Visualizzazione**: Layout grafico interattivo batch
- **Simulazione**: Preview ottimizzazione prima conferma

### 6. Controllo Qualità

- **Piani Ispezione**: Personalizzati per part number
- **Non Conformità**: Gestione NC con workflow
- **Azioni Correttive**: Sistema CAPA integrato
- **Certificati**: Generazione certificati conformità
- **Audit Trail**: Tracciabilità completa modifiche

### 7. Gestione Utenti e Ruoli

**Ruoli Sistema**:
- `ADMIN`: Accesso completo sistema
- `SUPERVISOR`: Gestione produzione
- `OPERATOR`: Operazioni base

**Ruoli Reparto**:
- `CAPO_REPARTO`: Responsabile reparto
- `CAPO_TURNO`: Supervisore turno
- `OPERATORE`: Operatore produzione

### 8. Import/Export Dati

- **Excel Sync**: Import/export parti, ODL, strumenti
- **Sistema Gamma**: Integrazione con MES legacy
- **Export CSV**: Dati produzione e qualità
- **Report PDF**: ODL, certificati, analisi

### 9. Dashboard e Reporting

- **KPI Real-time**: OEE, throughput, scarti
- **Grafici Interattivi**: Trend produzione con Recharts
- **Report Personalizzati**: Template configurabili
- **Export Multipli**: PDF, Excel, CSV

### 10. Amministrazione Sistema

- **Gestione Reparti**: Configurazione parametri produzione
- **Audit Logs**: Monitoraggio tutte operazioni
- **Backup**: Export completo dati sistema
- **Impostazioni**: Configurazioni globali

## 💻 Utilizzo

### Login e Autenticazione

```bash
# Credenziali test (solo sviluppo locale)
Admin: admin@mantaaero.com / password123
Supervisor: capo.cleanroom@mantaaero.com / password123  
Operator: op1.cleanroom@mantaaero.com / password123
```

### Workflow Tipico Produzione

1. **Creazione ODL**
   - Menu → Produzione → ODL → Crea Nuovo
   - Inserire dati ODL e quantità
   - Sistema genera QR automaticamente

2. **Tracking con QR**
   - Operatore scansiona QR all'ingresso reparto
   - Sistema registra entry automatico
   - Al termine, scansiona per exit

3. **Trasferimento Reparti**
   - Workflow automatico sposta ODL
   - Validazioni business rules
   - Notifiche reparto successivo

4. **Controllo Qualità**
   - Ispezioni a campione o 100%
   - Registrazione non conformità
   - Azioni correttive se necessario

5. **Completamento**
   - ODL completato dopo ultimo reparto
   - Generazione certificati
   - Archiviazione documentazione

### Ottimizzazione Autoclavi

1. **Accesso**: Menu → Autoclavi → Ottimizzazione
2. **Selezione ODL**: Check ODL compatibili
3. **Analisi**: Click "Analizza Ottimizzazione"
4. **Review**: Visualizza layout proposto
5. **Conferma**: Crea batch ottimizzato

## 🔌 API Documentation

### Autenticazione

Tutte le API richiedono autenticazione tramite NextAuth session cookie.

### Endpoints Principali

#### ODL Management
```http
GET    /api/odl                      # Lista ODL con filtri
POST   /api/odl                      # Crea nuovo ODL
GET    /api/odl/[id]                 # Dettaglio ODL
PUT    /api/odl/[id]                 # Aggiorna ODL
DELETE /api/odl/[id]                 # Elimina ODL
POST   /api/odl/[id]/assign-department # Assegna reparto
```

#### Production Tracking
```http
POST   /api/production/events         # Registra evento
GET    /api/production/events/odl/[id] # Eventi per ODL
GET    /api/production/stats          # Statistiche
GET    /api/production/dashboard/kpi  # KPI dashboard
```

#### Autoclavi
```http
GET    /api/autoclavi/batches         # Lista batch
POST   /api/autoclavi/batches         # Crea batch
POST   /api/autoclavi/optimization/analyze  # Analizza
POST   /api/autoclavi/optimization/execute  # Esegui
```

#### Parts & Tools
```http
GET    /api/parts                     # Lista parti
POST   /api/parts                     # Crea parte
GET    /api/tools                     # Lista strumenti
POST   /api/tools                     # Crea strumento
```

### Formato Risposte

```typescript
// Successo
{
  "success": true,
  "data": { ... }
}

// Errore
{
  "success": false,
  "error": "Messaggio errore"
}
```

## 🧪 Testing

### Test Manuali

```bash
# 1. Setup ambiente test
npm run db:seed-complete

# 2. Test scanner QR
- Vai su /qr-scanner
- Usa smartphone per test mobile
- Verifica offline mode

# 3. Test workflow
- Crea ODL test
- Traccia attraverso reparti
- Verifica trasferimenti automatici
```

### Test Automatici (TODO)

```bash
# Unit tests
npm run test

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Netlify (Consigliato)

1. **Setup Database**
   - Crea database PostgreSQL su Neon
   - Configura connection string

2. **Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-app.netlify.app
   NEXTAUTH_SECRET=your-secret-key
   ```

3. **Deploy**
   - Connetti repo GitHub
   - Build command: `npm run build`
   - Publish directory: `.next`

### Docker Production

```bash
# Build image
docker build -t mes-aerospazio .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e NEXTAUTH_URL=... \
  -e NEXTAUTH_SECRET=... \
  mes-aerospazio
```

## 🛤️ Roadmap

### In Sviluppo

1. **Sistema Audit Completo** (Alta Priorità)
   - Export audit logs
   - Notifiche eventi critici
   - Retention policy configurabile

2. **Email Service** (Alta Priorità)
   - Provider multipli (SendGrid, SMTP)
   - Template email personalizzati
   - Queue con retry logic

3. **Modulo NDI Avanzato** (Media Priorità)
   - Metodologie ispezione multiple
   - Integrazione strumenti NDI
   - Report difettosità

### Funzionalità Future

1. **Ottimizzazione Avanzata**
   - Machine Learning per previsioni
   - Simulazione multi-scenario
   - Ottimizzazione multi-obiettivo

2. **Real-time Notifications**
   - WebSocket per eventi live
   - Push notifications mobile
   - Dashboard monitoring

3. **Analytics Avanzate**
   - Business Intelligence integrata
   - Predictive maintenance
   - Supply chain visibility

4. **Integrazioni**
   - ERP (SAP, Oracle)
   - PLM systems
   - IoT sensori produzione

## 🤝 Contribuire

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

### Convenzioni

- **Commit**: Conventional Commits (feat, fix, docs, etc.)
- **Code Style**: ESLint + Prettier configurati
- **TypeScript**: Strict mode abilitato
- **Testing**: Minimo 80% coverage per nuove features

## 📄 Licenza

Proprietario - © 2024 Manta Aerospace. Tutti i diritti riservati.

## 📞 Supporto

- **Email**: support@mantaaero.com
- **Documentation**: [docs.mantaaero.com](https://docs.mantaaero.com)
- **Issues**: [GitHub Issues](https://github.com/mantaaero/mes-aerospazio/issues)

---

Sviluppato con ❤️ da Manta Aerospace Team