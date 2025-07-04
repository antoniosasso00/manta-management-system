# Configurazione Netlify per MES Aerospazio

## 🚨 IMPORTANTE: Configurazione Variabili d'Ambiente

### 1. Accedi al tuo dashboard Netlify
- Vai su [netlify.com](https://netlify.com)
- Seleziona il tuo sito
- Vai in **Site Settings → Environment Variables**

### 2. Aggiungi le seguenti variabili d'ambiente:

#### Database (OBBLIGATORIO)
```
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/database?sslmode=require
```

#### NextAuth.js (OBBLIGATORIO)
```
NEXTAUTH_URL=https://your-app.netlify.app
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
```

#### Email per Password Reset (OBBLIGATORIO)
```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### Build Configuration (CONSIGLIATO)
```
NODE_VERSION=18
NPM_VERSION=9
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=1
NEXT_RUNTIME=edge
```

### 3. Configurazione Database Neon

#### Crea un database su Neon:
1. Vai su [neon.tech](https://neon.tech)
2. Crea un nuovo progetto
3. Copia la connection string
4. Aggiungila come `DATABASE_URL` in Netlify

#### Migra il database:
```bash
# Dal tuo computer locale
npm run db:migrate
npm run db:seed-complete
```

### 4. Setup Email (Gmail)

#### Configura App Password:
1. Vai nelle impostazioni Google Account
2. Attiva 2FA se non già attivo
3. Genera una App Password per "Mail"
4. Usa questa password (non quella normale) per `EMAIL_SERVER_PASSWORD`

### 5. Genera NEXTAUTH_SECRET

```bash
# Genera un secret sicuro
openssl rand -base64 32
```

### 6. Controlla il Deploy

#### Netlify Functions:
- Le API routes sono configurate per funzionare come Netlify Functions
- Controlla che `/api/*` sia correttamente redirect verso `/.netlify/functions/:splat`

#### Runtime Configuration:
- `NEXT_RUNTIME=edge` per performance ottimali
- Plugin `@netlify/plugin-nextjs` per compatibilità App Router

### 7. Risoluzione Problemi Comuni

#### Errore "Server Configuration Issue":
- Verifica che tutte le variabili d'ambiente siano impostate
- Controlla che DATABASE_URL sia corretto
- Verifica che NEXTAUTH_SECRET sia lungo almeno 32 caratteri

#### Errore "Failed to load resource":
- Controlla che il redirect `/api/*` sia configurato
- Verifica che le funzioni Netlify siano abilitate
- Controlla i logs di deployment

#### Errore di autenticazione:
- Verifica che NEXTAUTH_URL corrisponda al tuo dominio Netlify
- Controlla che EMAIL_SERVER_* sia configurato correttamente

### 8. Deployment Checklist

- [ ] Variabili d'ambiente configurate
- [ ] Database Neon creato e migrato
- [ ] Email Gmail configurato con App Password
- [ ] NEXTAUTH_SECRET generato
- [ ] `netlify.toml` aggiornato
- [ ] Deploy successful su Netlify

### 9. Monitoraggio Post-Deploy

#### Controlla i logs:
- Netlify Dashboard → Functions → View logs
- Verifica che non ci siano errori 500
- Controlla che le chiamate API funzionino

#### Test funzionalità:
- Login/logout
- Password reset
- Creazione utenti
- Scansione QR (se necessario)

### 10. Performance Optimization

#### Headers di Cache:
- File statici: 1 anno
- API routes: no-cache
- Pagine: cache estrategico

#### Security Headers:
- CSP configurato per MUI
- X-Frame-Options: DENY
- HSTS abilitato
- XSS Protection attiva

## 🔧 Comandi Utili

```bash
# Test build locale
npm run build

# Genera client Prisma
npm run db:generate

# Migra database
npm run db:migrate

# Seed completo
npm run db:seed-complete

# Verifica TypeScript
npx tsc --noEmit
```

## 📞 Supporto

Se hai problemi con la configurazione:
1. Controlla i logs di Netlify
2. Verifica le variabili d'ambiente
3. Testa il database connection localmente
4. Controlla che tutte le dipendenze siano installate

**Note**: Questo setup è ottimizzato per applicazioni industriali con sicurezza elevata.