#!/bin/bash

# Script di setup completo per il microservizio

echo "🔧 Setup Microservizio Ottimizzazione MES"
echo "========================================"

# Controlla se Python 3 è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installa con:"
    echo "   sudo apt-get update && sudo apt-get install python3 python3-pip python3-venv"
    exit 1
fi

# Crea virtual environment se non esiste
if [ ! -d "venv" ]; then
    echo "📦 Creazione ambiente virtuale Python..."
    python3 -m venv venv
    echo "✅ Ambiente virtuale creato"
else
    echo "✅ Ambiente virtuale già esistente"
fi

# Attiva virtual environment
echo "🔄 Attivazione ambiente virtuale..."
source venv/bin/activate

# Aggiorna pip
echo "📦 Aggiornamento pip..."
python -m pip install --upgrade pip

# Installa dipendenze base
echo "📥 Installazione dipendenze..."
pip install -r requirements.txt

# Installa OR-Tools
echo "🧮 Installazione Google OR-Tools (potrebbe richiedere qualche minuto)..."
pip install ortools

# Verifica installazione
echo ""
echo "🔍 Verifica installazione..."
python -c "import ortools; print(f'✅ OR-Tools versione {ortools.__version__} installato con successo!')"

# Crea file .env se non esiste
if [ ! -f ".env" ]; then
    echo "⚙️  Creazione file .env..."
    cp .env.example .env
    echo "✅ File .env creato"
fi

echo ""
echo "✅ Setup completato con successo!"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Per avviare il servizio: ./run.sh"
echo "   2. Per test completo: python test_runner.py"
echo "   3. API docs: http://localhost:8000/docs"
echo ""
echo "💡 Ricorda: ogni volta che apri un nuovo terminale, attiva l'ambiente con:"
echo "   source venv/bin/activate"