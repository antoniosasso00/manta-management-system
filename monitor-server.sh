#!/bin/bash

# Script di monitoraggio server
PORT=3001
URL="http://localhost:${PORT}"

while true; do
    if curl -s --connect-timeout 5 "${URL}" > /dev/null; then
        echo "✅ [$(date '+%H:%M:%S')] Server attivo su ${URL}"
    else
        echo "❌ [$(date '+%H:%M:%S')] Server non risponde su ${URL}"
        echo "🔄 Tentativo riavvio..."
        ./start-dev.sh &
    fi
    sleep 30
done