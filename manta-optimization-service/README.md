# MES Optimization Service

Microservizio di ottimizzazione batch autoclavi per MES Aerospazio.

## Funzionalità

- **Pre-filtering cicli di cura**: Analizza e suggerisce i cicli più efficienti
- **Pre-filtering supporti rialzati**: Identifica tool candidati per elevazione
- **Ottimizzazione multi-autoclave**: Distribuzione intelligente ODL su più autoclavi
- **Visualizzazione 2D**: Layout grafici con coordinate per operatori
- **Export**: PDF per stampa, DXF per CAD

## Architettura

```
manta-optimization-service/
├── api/                    # FastAPI endpoints
│   ├── routes/            # API routes
│   └── models/            # Pydantic models
├── core/                   # Business logic
│   ├── pre_filters/       # Algoritmi pre-filtering
│   ├── optimization/      # Motore ottimizzazione
│   └── visualization/     # Generazione layout
└── domain/                # Entità di dominio
```

## Installazione

```bash
# Crea ambiente virtuale
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate  # Windows

# Installa dipendenze
pip install -r requirements.txt

# Copia configurazione
cp .env.example .env
```

## Avvio

```bash
# Development
uvicorn api.main:app --reload --port 8000

# Production
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```
GET /api/v1/health
GET /api/v1/health/info
```

### Ottimizzazione
```
POST /api/v1/optimization/analyze
POST /api/v1/optimization/analyze-elevated
POST /api/v1/optimization/execute
GET  /api/v1/optimization/batch/{batch_id}/export/pdf
GET  /api/v1/optimization/batch/{batch_id}/export/dxf
```

## Documentazione API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Algoritmi

### 1. Pre-filtering Cicli di Cura
Calcola score basato su:
- Numero pezzi per ciclo
- Uniformità dimensionale
- Densità potenziale

### 2. Pre-filtering Supporti Rialzati
Identifica tool con:
- Area > 500000 mm²
- Aspect ratio > 1.5
- Peso ragionevole

### 3. Ottimizzazione Multi-Autoclave
Approccio ibrido:
1. First Fit Decreasing per distribuzione iniziale
2. CP-SAT (OR-Tools) per layout ottimale
3. Greedy fallback se necessario
4. Post-ottimizzazione con swap inter-autoclave

## Integrazione con MES

Il servizio comunica con l'app Next.js tramite REST API:

```typescript
// Next.js service
const result = await fetch('http://localhost:8000/api/v1/optimization/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    odls: [...],
    autoclaves: [...],
    selected_cycles: [...],
    elevated_tools: [...],
    constraints: {...}
  })
});
```

## Performance

- Timeout configurabile (default 5 minuti)
- Multi-threading per solver (default 4 threads)
- Caching risultati per export

## Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing

```bash
# Run tests
pytest

# Con coverage
pytest --cov=core --cov=api
```