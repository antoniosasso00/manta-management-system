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

### 4.2 Domain Entities (Prisma Schema)
```prisma
// schema.prisma
model WorkOrder {
  id          String   @id @default(cuid())
  odlNumber   String   @unique
  partNumber  String
  description String?
  quantity    Int
  priority    Priority @default(NORMAL)
  status      OrderStatus @default(PENDING)
  dueDate     DateTime
  
  // Relations
  events      ProductionEvent[]
  allocations ResourceAllocation[]
  batchItems  BatchItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("work_orders")
}

model ProductionEvent {
  id            String    @id @default(cuid())
  workOrderId   String
  departmentId  String
  eventType     EventType // ENTER, EXIT, START, COMPLETE
  timestamp     DateTime  @default(now())
  operatorId    String?
  qrCode        String?
  
  // Relations
  workOrder     WorkOrder @relation(fields: [workOrderId], references: [id])
  department    Department @relation(fields: [departmentId], references: [id])
  operator      User?      @relation(fields: [operatorId], references: [id])
  
  @@map("production_events")
}

model Department {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  type        DepartmentType // CLEAN_ROOM, AUTOCLAVE, MACHINING
  capacity    Int
  isActive    Boolean  @default(true)
  
  // Relations
  events      ProductionEvent[]
  allocations ResourceAllocation[]
  
  @@map("departments")
}

model Autoclave {
  id          String   @id @default(cuid())
  name        String
  width       Float    // cm
  height      Float    // cm
  maxTemp     Int      // °C
  isActive    Boolean  @default(true)
  
  // Relations
  batches     ProductionBatch[]
  
  @@map("autoclaves")
}

model ProductionBatch {
  id          String   @id @default(cuid())
  autoclaveId String
  startTime   DateTime?
  endTime     DateTime?
  temperature Int?
  status      BatchStatus @default(PLANNED)
  efficiency  Float?
  
  // Relations
  autoclave   Autoclave @relation(fields: [autoclaveId], references: [id])
  items       BatchItem[]
  
  @@map("production_batches")
}

model BatchItem {
  id           String   @id @default(cuid())
  batchId      String
  workOrderId  String
  positionX    Float    // Coordinate X su piano autoclave
  positionY    Float    // Coordinate Y su piano autoclave
  rotation     Float    @default(0)
  
  // Relations
  batch        ProductionBatch @relation(fields: [batchId], references: [id])
  workOrder    WorkOrder @relation(fields: [workOrderId], references: [id])
  
  @@map("batch_items")
}

model ResourceAllocation {
  id           String   @id @default(cuid())
  resourceId   String
  workOrderId  String
  departmentId String
  startTime    DateTime
  endTime      DateTime
  isActive     Boolean  @default(true)
  
  // Relations
  resource     User       @relation(fields: [resourceId], references: [id])
  workOrder    WorkOrder  @relation(fields: [workOrderId], references: [id])
  department   Department @relation(fields: [departmentId], references: [id])
  
  @@map("resource_allocations")
}

// Enums
enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum EventType {
  ENTER
  EXIT
  START
  COMPLETE
  PAUSE
  RESUME
}

enum DepartmentType {
  CLEAN_ROOM
  AUTOCLAVE
  MACHINING
  ASSEMBLY
  QUALITY
}

enum BatchStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

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

### 6.1 Approccio Euristico (Fase 1)
```typescript
// domains/planning/services/BatchOptimizer.ts
export class BatchOptimizer {
  async optimizeBatch(
    workOrders: WorkOrder[],
    autoclave: Autoclave
  ): Promise<BatchSolution> {
    
    // 1. Filtra ODL compatibili
    const compatible = this.filterCompatibleCycles(workOrders);
    
    // 2. Ordina per priorità e dimensione
    const sorted = this.sortByPriorityAndSize(compatible);
    
    // 3. Algoritmo First-Fit Decreasing
    const placement = this.firstFitDecreasing(sorted, autoclave);
    
    // 4. Ottimizza posizionamento
    const optimized = this.optimizePositioning(placement);
    
    return {
      items: optimized,
      efficiency: this.calculateEfficiency(optimized, autoclave),
      estimatedTime: this.calculateCycleTime(optimized)
    };
  }
  
  private firstFitDecreasing(
    items: WorkOrder[],
    autoclave: Autoclave
  ): BatchItem[] {
    const result: BatchItem[] = [];
    const occupiedAreas: Rectangle[] = [];
    
    for (const item of items) {
      const position = this.findBestPosition(
        item.dimensions,
        autoclave.dimensions,
        occupiedAreas
      );
      
      if (position) {
        result.push({
          workOrderId: item.id,
          positionX: position.x,
          positionY: position.y,
          rotation: position.rotation
        });
        
        occupiedAreas.push({
          x: position.x,
          y: position.y,
          width: item.dimensions.width,
          height: item.dimensions.height
        });
      }
    }
    
    return result;
  }
}
```

### 6.2 Visualizzazione 2D
```typescript
// components/organisms/AutoclaveVisualizer.tsx
import { Canvas } from '@react-three/fiber';

export const AutoclaveVisualizer = ({ batch, autoclave }) => {
  return (
    <div className="w-full h-96 border rounded-lg">
      <Canvas>
        {/* Piano autoclave */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[autoclave.width, autoclave.height]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
        
        {/* Pezzi posizionati */}
        {batch.items.map((item, index) => (
          <mesh 
            key={index}
            position={[item.positionX, item.positionY, 0.1]}
          >
            <boxGeometry args={[item.width, item.height, 0.1]} />
            <meshStandardMaterial color={getColorByPriority(item.priority)} />
          </mesh>
        ))}
      </Canvas>
    </div>
  );
};
```

## 7. Sistema QR Code

### 7.1 Generazione QR
```typescript
// domains/production/services/QRService.ts
import QRCode from 'qrcode';

export class QRService {
  async generateQRCode(workOrder: WorkOrder): Promise<string> {
    const qrData = {
      type: 'ODL',
      id: workOrder.id,
      odlNumber: workOrder.odlNumber,
      timestamp: new Date().toISOString()
    };
    
    const qrString = JSON.stringify(qrData);
    const qrCode = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCode;
  }
  
  parseQRCode(qrString: string): QRData {
    const data = JSON.parse(qrString);
    return QRDataSchema.parse(data);
  }
}
```

### 7.2 Scanner Component
```typescript
// components/molecules/QRScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

export const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5QrcodeScanner>();
  
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      (decodedText) => {
        try {
          const qrData = JSON.parse(decodedText);
          onScan(qrData);
        } catch (error) {
          onError('QR Code non valido');
        }
      },
      (error) => {
        console.warn('QR Scanner error:', error);
      }
    );
    
    scannerRef.current = scanner;
    
    return () => {
      scanner.clear();
    };
  }, [onScan, onError]);
  
  return <div id="qr-reader" className="w-full max-w-sm mx-auto" />;
};
```

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
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticate = async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!req.user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Token non valido' });
  }
};
```

### 10.2 Validazione Input
```typescript
// utils/validation.ts
import { z } from 'zod';

export const createODLSchema = z.object({
  odlNumber: z.string().min(1, 'Numero ODL richiesto'),
  partNumber: z.string().regex(/^[A-Z0-9]+$/, 'Formato part number non valido'),
  quantity: z.number().positive('Quantità deve essere positiva'),
  dueDate: z.date().min(new Date(), 'Data consegna deve essere futura')
});

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Dati non validi',
        details: error.errors 
      });
    }
  };
};
```

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