# QR System Implementation Guide

## 1. QR Code Generation

### Service Layer
```typescript
// src/domains/production/services/QRService.ts
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

### Component
```typescript
// src/components/molecules/QRGenerator.tsx
export const QRGenerator = ({ odlId, size = 256, downloadable = false }) => {
  const [qrCode, setQrCode] = useState<string>();
  
  const generateQR = async () => {
    const response = await fetch(`/api/qr/generate/${odlId}`);
    const data = await response.json();
    setQrCode(data.qrCode);
  };
  
  return (
    <Card>
      <CardContent>
        {qrCode && <img src={qrCode} alt="QR Code" width={size} height={size} />}
        <Button onClick={generateQR}>Genera QR</Button>
        {downloadable && (
          <Button onClick={() => downloadQR(qrCode)}>Download PDF</Button>
        )}
      </CardContent>
    </Card>
  );
};
```

## 2. QR Code Scanner

### Scanner Component
```typescript
// src/components/molecules/QRScanner.tsx
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

## 3. API Endpoints

### Generate QR
```typescript
// src/app/api/qr/generate/[odlId]/route.ts
export async function POST(
  request: Request,
  { params }: { params: { odlId: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.odlId }
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 });
    }
    
    const qrService = new QRService();
    const qrCode = await qrService.generateQRCode(workOrder);
    
    // Save QR to database
    await prisma.qrCode.create({
      data: {
        workOrderId: workOrder.id,
        code: qrCode,
        createdAt: new Date()
      }
    });
    
    return NextResponse.json({ qrCode });
  } catch (error) {
    return NextResponse.json({ error: 'Errore generazione QR' }, { status: 500 });
  }
}
```

### Validate QR
```typescript
// src/app/api/qr/validate/route.ts
export async function POST(request: Request) {
  try {
    const { qrData } = await request.json();
    
    const qrService = new QRService();
    const parsedData = qrService.parseQRCode(qrData);
    
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parsedData.id }
    });
    
    if (!workOrder) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 });
    }
    
    return NextResponse.json({ workOrder, valid: true });
  } catch (error) {
    return NextResponse.json({ error: 'QR non valido' }, { status: 400 });
  }
}
```

## 4. Database Schema

```prisma
model QRCode {
  id          String   @id @default(cuid())
  workOrderId String
  code        String   @unique
  scansCount  Int      @default(0)
  createdAt   DateTime @default(now())
  
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id])
  
  @@map("qr_codes")
}
```

## 5. Validation Schema

```typescript
// src/domains/production/schemas/qr.ts
import { z } from 'zod';

export const QRDataSchema = z.object({
  type: z.literal('ODL'),
  id: z.string().cuid(),
  odlNumber: z.string().min(1),
  timestamp: z.string().datetime()
});

export type QRData = z.infer<typeof QRDataSchema>;
```