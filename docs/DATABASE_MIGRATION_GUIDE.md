# Guida Migrazione Database - MES Aerospazio

## Overview

Questa guida spiega come migrare il database del sistema MES Aerospazio tra diversi provider (locale Docker → Neon, Neon → nuovo Neon, ecc.).

## Configurazioni Database Supportate

### 1. PostgreSQL Locale (Development)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mes_aerospazio"
```

### 2. Neon PostgreSQL (Production)
```env
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
```

### 3. Altri Provider PostgreSQL
```env
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

## Procedura Migrazione Completa

### Step 1: Backup Database Corrente (IMPORTANTE)

```bash
# Backup schema e dati
npx prisma db pull --print > backup-schema.prisma
npx prisma db execute --file=backup-data.sql --url="$OLD_DATABASE_URL"

# Backup configurazione
cp .env .env.backup-$(date +%Y%m%d_%H%M%S)
```

### Step 2: Configurazione Nuovo Database

#### Opzione A: Nuovo Database Neon via Netlify
1. **Netlify Dashboard** → Extensions → Neon → "Add new database"
2. **Crea nuovo database**: `manta-management-system-prod`
3. **Copia DATABASE_URL** fornito da Netlify
4. **Aggiorna .env**:
```bash
# Sostituisci DATABASE_URL in .env
nano .env
```

#### Opzione B: Nuovo Database Neon Console
1. **Neon Console** → Create Project → `manta-mes-prod`
2. **Copia connection string** dal dashboard
3. **Aggiorna .env**

#### Opzione C: Database Locale → Neon
```bash
# Backup locale
cp .env .env.local-backup

# Switch a Neon
cp .env.production.example .env
# Modifica DATABASE_URL con credenziali Neon
```

### Step 3: Inizializzazione Nuovo Database

```bash
# 1. Verifica connessione
npm run db:generate

# 2. Sincronizza schema
npm run db:push

# 3. Verifica tabelle create
npx prisma studio
# Aprirà GUI per verificare struttura database
```

### Step 4: Migrazione Dati

#### Opzione A: Seed Completo (Development/Testing)
```bash
# Carica dati di test completi
npm run db:seed-complete

# Verifica dati
npx prisma studio
```

#### Opzione B: Migrazione Dati Reali (Production)
```bash
# Esporta da database vecchio
npx prisma db execute --schema=./prisma/schema.prisma --file=export-data.sql

# Importa in nuovo database  
npx prisma db execute --schema=./prisma/schema.prisma --file=import-data.sql
```

#### Opzione C: Migrazione Selettiva
```sql
-- Script SQL per migrazione tabelle specifiche
-- Esempio: solo utenti e configurazioni

INSERT INTO "User" (id, email, name, role, hashedPassword, department, isActive)
SELECT id, email, name, role, hashedPassword, department, isActive 
FROM old_database."User";

INSERT INTO "Department" (id, name, type, description, isActive)
SELECT id, name, type, description, isActive 
FROM old_database."Department";
```

### Step 5: Validazione Migrazione

```bash
# 1. Test connessione
curl http://localhost:3000/api/health

# 2. Test autenticazione
npm run dev
# Vai a http://localhost:3000/login

# 3. Test funzionalità core
# - Login utente
# - Creazione ODL
# - Scan QR Code
# - Dashboard produzione

# 4. Verifica performance
npx prisma generate
npm run build
```

## Configurazioni per Ambienti Diversi

### Development (Docker Locale)
```bash
# .env.development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mes_aerospazio"
NEXTAUTH_URL="http://localhost:3000"

# Avvia servizi
docker compose up -d
npm run db:push
npm run db:seed-complete
```

### Staging (Neon Staging)
```bash
# .env.staging  
DATABASE_URL="postgresql://user:pass@staging-host.neon.tech/mes_staging?sslmode=require"
NEXTAUTH_URL="https://staging.mantaaero.com"

# Deploy staging
npm run db:push
npm run db:seed-complete
```

### Production (Neon Production)
```bash
# .env.production
DATABASE_URL="postgresql://user:pass@prod-host.neon.tech/mes_production?sslmode=require"  
NEXTAUTH_URL="https://app.mantaaero.com"

# Deploy production
npm run db:migrate
# NO seed in production - dati reali
```

## Troubleshooting

### Errore: "Database does not exist"
```bash
# Crea database manualmente
npx prisma db push --force-reset
npm run db:seed-complete
```

### Errore: "Connection timeout"
```bash
# Verifica URL e credenziali
echo $DATABASE_URL
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1;"
```

### Errore: "Schema drift detected"
```bash
# Reset schema
npx prisma db push --force-reset
# ATTENZIONE: Questo cancella tutti i dati!
```

### Errore: "Unique constraint failed"
```bash
# Pulizia database prima seed
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "TRUNCATE TABLE \"User\" CASCADE;"
npm run db:seed-complete
```

## Rollback Procedure

### Rollback Veloce
```bash
# Ripristina configurazione precedente
cp .env.backup .env
npm run db:generate
npm run dev
```

### Rollback con Dati
```bash
# Ripristina database + dati
cp .env.backup .env
npx prisma db push
# Reimporta backup dati se necessario
```

## Checklist Migrazione

### Pre-Migrazione
- [ ] **Backup completo** database corrente
- [ ] **Backup .env** con timestamp
- [ ] **Test applicazione** funzionante pre-migrazione
- [ ] **Documentazione** credenziali nuovo database

### Durante Migrazione  
- [ ] **Nuovo DATABASE_URL** configurato
- [ ] **Schema sincronizzato** (`npm run db:push`)
- [ ] **Dati migrati** o seed caricato
- [ ] **Prisma Client** rigenerato

### Post-Migrazione
- [ ] **Test login** funzionante
- [ ] **Test CRUD** ODL/Parts
- [ ] **Test QR Scanner** 
- [ ] **Performance check** query database
- [ ] **Backup nuova configurazione**

## Comandi Utili

```bash
# Verifica connessione database
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT current_database(), version();"

# Lista tabelle
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"

# Conta record tabelle principali  
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "
SELECT 
  'User' as table_name, COUNT(*) as records FROM \"User\"
UNION ALL SELECT 
  'ODL' as table_name, COUNT(*) as records FROM \"ODL\"  
UNION ALL SELECT
  'Part' as table_name, COUNT(*) as records FROM \"Part\";
"

# Reset completo database (DANGER!)
npx prisma db push --force-reset
npm run db:seed-complete

# Backup SQL completo
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d_%H%M%S).sql
```

## File di Configurazione

### Environment Files Structure
```
.env                    # Configurazione attiva
.env.local             # Development locale override  
.env.production        # Production deployment
.env.staging           # Staging environment
.env.backup-YYYYMMDD   # Backup timestampati
```

### Configurazione Prisma
```
prisma/
├── schema.prisma      # Schema principale
├── seed.ts           # Seed base
├── seed-complete.ts  # Seed esteso per testing
└── migrations/       # Migration files (production)
```

## Sicurezza

### Protezione Credenziali
- **Mai committare** `.env` con credenziali reali
- **Usare** variabili environment in production
- **Rotazione** password periodica
- **Accesso limitato** al database production

### SSL/TLS
```env
# Sempre usare SSL in production
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&channel_binding=require"
```

### Backup Strategy
- **Backup automatici** daily (Neon incluso)
- **Backup manuali** prima migrazioni
- **Test restore** periodici
- **Documentazione** procedure recovery