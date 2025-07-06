#!/bin/bash

echo "📦 Installazione pip per Python 3"
echo "================================"

# Verifica se pip è già installato
if command -v pip3 &> /dev/null; then
    echo "✅ pip3 già installato"
    pip3 --version
    exit 0
fi

# Scarica get-pip.py
echo "📥 Download script di installazione pip..."
wget -q https://bootstrap.pypa.io/get-pip.py

if [ ! -f "get-pip.py" ]; then
    echo "❌ Errore nel download di get-pip.py"
    exit 1
fi

# Installa pip per l'utente corrente
echo "🔧 Installazione pip..."
python3 get-pip.py --user

# Pulisci
rm get-pip.py

# Aggiungi PATH se necessario
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo ""
    echo "⚠️  Aggiungi questa riga al tuo ~/.bashrc:"
    echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "Poi esegui:"
    echo "   source ~/.bashrc"
fi

echo ""
echo "✅ Installazione completata!"
echo ""
echo "Verifica con:"
echo "   pip3 --version"
echo "   oppure"
echo "   python3 -m pip --version"