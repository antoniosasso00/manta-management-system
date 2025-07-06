#!/bin/bash

# Script per avviare il microservizio di ottimizzazione

echo "🚀 Avvio Microservizio di Ottimizzazione MES..."

# Crea virtual environment se non esiste
if [ ! -d "venv" ]; then
    echo "📦 Creazione virtual environment..."
    python3 -m venv venv
fi

# Attiva virtual environment
echo "🔧 Attivazione virtual environment..."
source venv/bin/activate

# Installa/aggiorna dipendenze
echo "📥 Installazione dipendenze..."
pip install -r requirements.txt

# Copia file .env se non esiste
if [ ! -f ".env" ]; then
    echo "⚙️ Creazione file .env da template..."
    cp .env.example .env
fi

# Avvia il servizio
echo "✅ Avvio servizio su http://localhost:8000..."
echo "📚 Documentazione API disponibile su http://localhost:8000/docs"
echo ""
uvicorn api.main:app --reload --port 8000