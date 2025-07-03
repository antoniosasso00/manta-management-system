# Autoclave Optimization Algorithm Implementation

## 1. Core Algorithm Service

```typescript
// src/domains/optimization/services/BatchOptimizer.ts
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

  private findBestPosition(
    itemDimensions: Dimensions,
    containerDimensions: Dimensions,
    occupiedAreas: Rectangle[]
  ): Position | null {
    const stepSize = 10; // cm
    
    for (let y = 0; y <= containerDimensions.height - itemDimensions.height; y += stepSize) {
      for (let x = 0; x <= containerDimensions.width - itemDimensions.width; x += stepSize) {
        const candidate = {
          x,
          y,
          width: itemDimensions.width,
          height: itemDimensions.height
        };
        
        if (!this.hasCollision(candidate, occupiedAreas)) {
          return { x, y, rotation: 0 };
        }
        
        // Try 90-degree rotation
        const rotatedCandidate = {
          x,
          y,
          width: itemDimensions.height,
          height: itemDimensions.width
        };
        
        if (x <= containerDimensions.width - itemDimensions.height &&
            y <= containerDimensions.height - itemDimensions.width &&
            !this.hasCollision(rotatedCandidate, occupiedAreas)) {
          return { x, y, rotation: 90 };
        }
      }
    }
    
    return null;
  }

  private hasCollision(rect: Rectangle, occupiedAreas: Rectangle[]): boolean {
    return occupiedAreas.some(occupied => 
      this.rectanglesOverlap(rect, occupied)
    );
  }

  private rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width <= rect2.x ||
             rect2.x + rect2.width <= rect1.x ||
             rect1.y + rect1.height <= rect2.y ||
             rect2.y + rect2.height <= rect1.y);
  }

  private calculateEfficiency(items: BatchItem[], autoclave: Autoclave): number {
    const totalUsedArea = items.reduce((sum, item) => {
      const workOrder = items.find(i => i.workOrderId === item.workOrderId);
      return sum + (workOrder?.dimensions.width * workOrder?.dimensions.height || 0);
    }, 0);
    
    const totalArea = autoclave.width * autoclave.height;
    return (totalUsedArea / totalArea) * 100;
  }

  private filterCompatibleCycles(workOrders: WorkOrder[]): WorkOrder[] {
    // Group by curing cycle compatibility
    const cycleGroups = workOrders.reduce((groups, order) => {
      const cycle = order.curingCycle;
      if (!groups[cycle]) groups[cycle] = [];
      groups[cycle].push(order);
      return groups;
    }, {} as Record<string, WorkOrder[]>);
    
    // Return largest compatible group
    return Object.values(cycleGroups)
      .sort((a, b) => b.length - a.length)[0] || [];
  }

  private sortByPriorityAndSize(workOrders: WorkOrder[]): WorkOrder[] {
    return workOrders.sort((a, b) => {
      // Priority first
      const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by area (largest first)
      const areaA = a.dimensions.width * a.dimensions.height;
      const areaB = b.dimensions.width * b.dimensions.height;
      return areaB - areaA;
    });
  }
}
```

## 2. API Endpoint

```typescript
// src/app/api/autoclaves/[id]/optimize/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { workOrderIds } = await request.json();
    
    const autoclave = await prisma.autoclave.findUnique({
      where: { id: params.id }
    });
    
    if (!autoclave) {
      return NextResponse.json({ error: 'Autoclave non trovato' }, { status: 404 });
    }
    
    const workOrders = await prisma.workOrder.findMany({
      where: {
        id: { in: workOrderIds },
        status: 'READY_FOR_AUTOCLAVE'
      },
      include: {
        part: {
          include: {
            curingCycle: true
          }
        }
      }
    });
    
    const optimizer = new BatchOptimizer();
    const solution = await optimizer.optimizeBatch(workOrders, autoclave);
    
    return NextResponse.json(solution);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore ottimizzazione batch' },
      { status: 500 }
    );
  }
}
```

## 3. 2D Visualization Component

```typescript
// src/components/organisms/AutoclaveVisualizer.tsx
import { Canvas } from '@react-three/fiber';

export const AutoclaveVisualizer = ({ batch, autoclave }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#ff4444';
      case 'HIGH': return '#ffaa00';
      case 'NORMAL': return '#44ff44';
      case 'LOW': return '#4444ff';
      default: return '#888888';
    }
  };

  return (
    <div className="w-full h-96 border rounded-lg">
      <Canvas camera={{ position: [0, 0, 10], orthographic: true }}>
        {/* Piano autoclave */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[autoclave.width / 10, autoclave.height / 10]} />
          <meshBasicMaterial color="lightgray" />
        </mesh>
        
        {/* Pezzi posizionati */}
        {batch.items.map((item, index) => (
          <mesh 
            key={index}
            position={[
              (item.positionX - autoclave.width/2) / 10,
              (item.positionY - autoclave.height/2) / 10,
              0.1
            ]}
          >
            <boxGeometry args={[
              item.width / 10,
              item.height / 10,
              0.1
            ]} />
            <meshStandardMaterial 
              color={getPriorityColor(item.workOrder.priority)} 
            />
          </mesh>
        ))}
      </Canvas>
      
      {/* Legenda */}
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500"></div>
          <span>Urgente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500"></div>
          <span>Alta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span>Normale</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500"></div>
          <span>Bassa</span>
        </div>
      </div>
    </div>
  );
};
```

## 4. Database Schema Extensions

```prisma
model Autoclave {
  id          String   @id @default(cuid())
  name        String
  width       Float    // cm
  height      Float    // cm
  maxTemp     Int      // °C
  isActive    Boolean  @default(true)
  
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
  
  batch        ProductionBatch @relation(fields: [batchId], references: [id])
  workOrder    WorkOrder @relation(fields: [workOrderId], references: [id])
  
  @@map("batch_items")
}

enum BatchStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## 5. Types and Interfaces

```typescript
// src/domains/optimization/types/batch.ts
export interface BatchSolution {
  items: BatchItem[];
  efficiency: number;
  estimatedTime: number;
}

export interface BatchItem {
  workOrderId: string;
  positionX: number;
  positionY: number;
  rotation: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
  rotation: number;
}

export interface Dimensions {
  width: number;
  height: number;
}
```

## 6. Performance Optimization Tips

1. **Grid-based positioning**: Use step sizes (10cm) to reduce computation
2. **Early termination**: Stop when efficiency target reached
3. **Constraint filtering**: Pre-filter incompatible items
4. **Caching**: Cache common configurations
5. **Timeout handling**: Maximum 30 seconds execution time

## 7. Testing Strategy

```typescript
// __tests__/BatchOptimizer.test.ts
describe('BatchOptimizer', () => {
  it('should optimize simple 2-item batch', () => {
    const optimizer = new BatchOptimizer();
    const autoclave = { width: 200, height: 100 };
    const items = [
      { id: '1', dimensions: { width: 80, height: 40 } },
      { id: '2', dimensions: { width: 60, height: 30 } }
    ];
    
    const result = optimizer.optimizeBatch(items, autoclave);
    
    expect(result.items).toHaveLength(2);
    expect(result.efficiency).toBeGreaterThan(50);
  });
});
```