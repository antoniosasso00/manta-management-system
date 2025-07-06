#!/bin/bash

# Script di setup alternativo senza virtual environment
# NOTA: Non consigliato per produzione!

echo "🔧 Setup Microservizio (modalità sistema)"
echo "========================================"
echo "⚠️  ATTENZIONE: Installerà pacchetti a livello di sistema"
echo ""

# Controlla se Python 3 è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installa con:"
    echo "   sudo apt-get update && sudo apt-get install python3 python3-pip"
    exit 1
fi

echo "📦 Installazione dipendenze a livello utente..."
echo "   (usando pip3 install --user)"
echo ""

# Installa dipendenze base per utente corrente
pip3 install --user fastapi uvicorn pydantic pydantic-settings python-multipart
pip3 install --user numpy matplotlib pillow reportlab python-dotenv httpx

echo ""
echo "🧮 Tentativo installazione OR-Tools..."
pip3 install --user ortools

# Crea file .env se non esiste
if [ ! -f ".env" ]; then
    echo "⚙️  Creazione file .env..."
    cp .env.example .env
    echo "✅ File .env creato"
fi

echo ""
echo "✅ Setup base completato!"
echo ""
echo "📝 Per avviare il servizio:"
echo "   python3 -m uvicorn api.main:app --reload --port 8000"
echo ""
echo "⚠️  IMPORTANTE: Per un setup corretto con virtual environment:"
echo "   1. sudo apt-get install python3-venv"
echo "   2. rm -rf venv"
echo "   3. ./setup.sh"