# Architettura Tecnica - MES Aerospazio

## 1. Panoramica Architetturale

### 1.1 Tipologia Applicativa
- **Pattern**: Monolitico modulare con Domain-Driven Design
- **Architettura**: Multi-page application con componenti condivisi
- **Approccio**: Atomic Design System con Material-UI
- **Scalabilità**: Verticale (MVP) → Orizzontale (futuro)

### 1.2 Principi Architetturali
- **Single Responsibility**: Ogni modulo ha una responsabilità specifica
- **Domain-Driven Design**: Organizzazione basata su domini business
- **Type Safety**: TypeScript + Zod per validazione runtime
- **Performance First**: Ottimizzazione per ambiente produttivo industriale

## 2. Stack Tecnologico

### 2.1 Frontend
```json
{
  "framework": "Next.js 15.x (App Router)",
  "language": "TypeScript 5.x",
  "ui": "Material-UI (MUI) v6",
  "styling": "Tailwind CSS v4 + MUI System",
  "state": "Zustand 5.x",
  "data": "@tanstack/react-query 5.x",
  "forms": "React Hook Form 7.x",
  "validation": "Zod 3.x",
  "qr": "react-qr-reader + qrcode",
  "charts": "Recharts 2.x",
  "dates": "date-fns 3.x"
}
```

### 2.2 Backend
```json
{
  "runtime": "Node.js 20+ LTS",
  "api": "Next.js API Routes",
  "database": "PostgreSQL 15+",
  "orm": "Prisma 6.x",
  "auth": "NextAuth.js + JWT",
  "validation": "Zod 3.x",
  "jobs": "BullMQ 5.x",
  "logging": "Winston 3.x",
  "files": "Multer + local storage",
  "email": "Nodemailer"
}
```

### 2.3 Infrastructure
```json
{
  "containerization": "Docker + Docker Compose",
  "database": "PostgreSQL 15",
  "cache": "Redis 7",
  "proxy": "Nginx",
  "ssl": "Certificati aziendali",
  "backup": "pg_dump + rsync",
  "monitoring": "Winston + file logs"
}
```

## 3. Architettura Frontend

### 3.1 Atomic Design System + MUI
```
src/
├── components/
│   ├── atoms/              # Elementi base
│   │   ├── Button.tsx     # Wrapper MUI Button
│   │   ├── Input.tsx      # Wrapper MUI TextField
│   │   ├── Badge.tsx      # Status indicators
│   │   └── QRCode.tsx     # QR display component
│   ├── molecules/          # Combinazioni di atoms
│   │   ├── QRScanner.tsx  # Scanner QR completo
│   │   ├── ODLCard.tsx    # Card ordine lavoro
│   │   ├── TimeDisplay.tsx # Visualizzazione tempi
│   │   └── StatusIndicator.tsx
│   ├── organisms/          # Sezioni complete
│   │   ├── ProductionTable.tsx
│   │   ├── BatchOptimizer.tsx
│   │   ├── DepartmentDashboard.tsx
│   │   └── ResourceScheduler.tsx
│   ├── templates/          # Layout di pagina
│   │   ├── DashboardLayout.tsx
│   │   ├── ProductionLayout.tsx
│   │   └── ReportLayout.tsx
│   └── pages/              # Pagine complete
│       ├── HomePage.tsx
│       ├── ProductionPage.tsx
│       └── ReportsPage.tsx
├── hooks/                  # Custom hooks
│   ├── useProductionData.ts
│   ├── useQRScanner.ts
│   └── useRealTimeUpdates.ts
├── services/               # API services
│   ├── api.ts
│   ├── auth.ts
│   └── gamma-sync.ts
├── stores/                 # Zustand stores
│   ├── productionStore.ts
│   ├── userStore.ts
│   └── notificationStore.ts
├── utils/                  # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── types/                  # TypeScript types
    ├── production.ts
    ├── user.ts
    └── api.ts
```

### 3.2 Component Architecture Pattern
```typescript
// Esempio: QRScannerCard (Molecule)
import { Card, CardContent, CardHeader } from '@mui/material';
import { Button } from '@/components/atoms/Button';
import { QRCode } from '@/components/atoms/QRCode';
import { useQRScanner } from '@/hooks/useQRScanner';

export const QRScannerCard = () => {
  const { isScanning, startScan, stopScan, lastScanned } = useQRScanner();
  
  return (
    <Card>
      <CardHeader title="Scansione ODL" />
      <CardContent>
        <QRCode value={lastScanned?.code} />
        <Button 
          onClick={isScanning ? stopScan : startScan}
          variant={isScanning ? 'outlined' : 'contained'}
        >
          {isScanning ? 'Interrompi' : 'Avvia Scansione'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 4. Architettura Backend (Domain-Driven Design)

### 4.1 Bounded Contexts
```
src/
├── domains/
│   ├── production/         # Core Domain
│   │   ├── entities/       # WorkOrder, ProductionEvent
│   │   ├── repositories/   # Data access
│   │   ├── services/       # Business logic
│   │   └── handlers/       # API handlers
│   ├── planning/           # Supporting Domain
│   │   ├── entities/       # Schedule, Allocation
│   │   ├── services/       # BatchOptimizer
│   │   └── handlers/       # Planning APIs
│   ├── quality/            # Supporting Domain
│   │   ├── entities/       # QualityCheck
│   │   └── services/       # Compliance
│   └── user/               # Generic Subdomain
│       ├── entities/       # User, Role
│       └── services/       # Authentication
├── shared/                 # Shared Kernel
│   ├── database/           # Prisma setup
│   ├── types/              # Common types
│   ├── utils/              # Utilities
│   └── middleware/         # Express middleware
└── infrastructure/         # Technical Details
    ├── gamma-sync/         # External integration
    ├── notifications/      # Telegram, Email
    └── jobs/               # Background jobs
```

### 4.2 Domain Entities
Vedi schema completo in `/prisma/schema.prisma`

**Entità principali**:
- **User**: Gestione utenti con ruoli dipartimentali
- **WorkOrder**: ODL con stati e priorità
- **ProductionEvent**: Eventi di produzione con tracking
- **Department**: Reparti produttivi
- **Autoclave**: Gestione autoclavi con batch optimization
- **Part**: Anagrafica parti con specifiche tecniche

**Per dettagli implementativi vedi**:
- [Authentication Implementation](./Implementations/AUTHENTICATION_IMPLEMENTATION.md)
- [QR System Implementation](./Implementations/QR_SYSTEM_IMPLEMENTATION.md)
- [Autoclave Optimization](./Implementations/AUTOCLAVE_OPTIMIZATION_IMPLEMENTATION.md)

## 5. Integrazione MES Gamma

### 5.1 Architettura Sincronizzazione
```typescript
// infrastructure/gamma-sync/GammaSyncService.ts
import chokidar from 'chokidar';
import { Queue } from 'bullmq';

export class GammaSyncService {
  private watcher: chokidar.FSWatcher;
  private syncQueue: Queue;
  
  constructor() {
    this.syncQueue = new Queue('gamma-sync');
    this.setupFileWatcher();
  }
  
  private setupFileWatcher() {
    this.watcher = chokidar.watch('/gamma-exports/*.{csv,xlsx}', {
      ignored: /^\./, // Ignora file nascosti
      persistent: true,
      ignoreInitial: true
    });
    
    this.watcher.on('add', (path) => {
      this.syncQueue.add('process-file', { filePath: path });
    });
  }
  
  async processFile(filePath: string) {
    try {
      const data = await this.parseFile(filePath);
      await this.validateData(data);
      await this.importData(data);
      await this.archiveFile(filePath);
      
      logger.info(`Gamma sync completed: ${filePath}`);
    } catch (error) {
      logger.error(`Gamma sync failed: ${filePath}`, error);
      throw error;
    }
  }
}
```

### 5.2 Data Mapping
```typescript
// infrastructure/gamma-sync/GammaMapper.ts
import { z } from 'zod';

const GammaODLSchema = z.object({
  numero_odl: z.string(),
  codice_articolo: z.string(),
  descrizione: z.string().optional(),
  quantita: z.number(),
  data_consegna: z.string().transform(str => new Date(str))
});

export class GammaMapper {
  static toWorkOrder(gammaData: z.infer<typeof GammaODLSchema>) {
    return {
      odlNumber: gammaData.numero_odl,
      partNumber: gammaData.codice_articolo,
      description: gammaData.descrizione,
      quantity: gammaData.quantita,
      dueDate: gammaData.data_consegna,
      status: 'PENDING' as const
    };
  }
}
```

## 6. Algoritmo Ottimizzazione Autoclavi

### 6.1 Approccio Implementativo
- **Algoritmo**: First-Fit Decreasing per 2D bin packing
- **Vincoli**: Cicli compatibili, dimensioni, priorità
- **Performance**: <30 secondi per ottimizzazione
- **Efficienza target**: >80% utilizzo spazio

### 6.2 Componenti Principali
- **BatchOptimizer**: Service di ottimizzazione
- **AutoclaveVisualizer**: Visualizzazione 2D layout
- **API Endpoints**: `/api/autoclaves/[id]/optimize`

**Per implementazione completa vedi**: [Autoclave Optimization Implementation](./Implementations/AUTOCLAVE_OPTIMIZATION_IMPLEMENTATION.md)

## 7. Sistema QR Code

### 7.1 Caratteristiche
- **Generazione**: QR univoci per ODL con JSON data
- **Scanner**: @zxing/browser per mobile compatibility
- **Formato**: `{type: 'ODL', id: string, timestamp: string}`
- **Validazione**: Zod schemas per data integrity

### 7.2 Componenti
- **QRService**: Generazione e parsing QR
- **QRScanner**: Scanner mobile-optimized
- **QRGenerator**: Component per visualizzazione/download

**Per implementazione completa vedi**: [QR System Implementation](./Implementations/QR_SYSTEM_IMPLEMENTATION.md)

## 8. Real-time Updates

### 8.1 Server-Sent Events
```typescript
// pages/api/events/production.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Invio eventi produzione
    const interval = setInterval(() => {
      sendEvent({
        type: 'production-update',
        timestamp: new Date().toISOString(),
        data: getProductionStatus()
      });
    }, 5000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
  }
}
```

### 8.2 Client Hook
```typescript
// hooks/useRealTimeUpdates.ts
export const useRealTimeUpdates = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/events/production');
    
    eventSource.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      setData(eventData);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);
  
  return data;
};
```

## 9. Deployment e Infrastructure

### 9.1 Docker Setup
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### 9.2 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/mes_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: mes_db
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 10. Sicurezza e Performance

### 10.1 Autenticazione
- **NextAuth.js**: JWT con Prisma adapter
- **Role-based access**: Admin, Supervisor, Operator
- **Department roles**: Ruoli specifici per reparto
- **Middleware**: Protezione routes automatica

### 10.2 Validazione
- **Zod schemas**: Validazione runtime end-to-end
- **Input sanitization**: Protezione SQL injection
- **Type safety**: TypeScript strict mode

**Per implementazione completa vedi**: [Authentication Implementation](./Implementations/AUTHENTICATION_IMPLEMENTATION.md)

## 11. Monitoraggio e Logging

### 11.1 Logging Strutturato
```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 11.2 Backup Automatico
```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="mes_db"

# Backup database
pg_dump -h localhost -U postgres $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup files
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" /app/uploads

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

Questa architettura garantisce scalabilità, manutenibilità e performance ottimali per il MES aerospazio, rispettando i vincoli temporali di 2 mesi per MVP e 6 mesi per versione completa.