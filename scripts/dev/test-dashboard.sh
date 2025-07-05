#!/bin/bash

echo "🧪 Test Dashboard Operatore"
echo "=========================="

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base
BASE_URL="http://localhost:3000"

echo ""
echo "1. Verificando server attivo..."
HEALTH_CHECK=$(curl -s ${BASE_URL}/api/health)
if [[ $HEALTH_CHECK == *"ok"* ]]; then
  echo -e "${GREEN}✓ Server attivo${NC}"
else
  echo -e "${RED}✗ Server non risponde${NC}"
  exit 1
fi

echo ""
echo "2. Test API senza autenticazione (dovrebbe reindirizzare)..."
echo "   - Test KPI API..."
KPI_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/production/dashboard/kpi)
if [[ $KPI_RESPONSE == "307" ]] || [[ $KPI_RESPONSE == "302" ]]; then
  echo -e "${GREEN}✓ API protetta correttamente (redirect al login)${NC}"
else
  echo -e "${RED}✗ API non protetta! Status: $KPI_RESPONSE${NC}"
fi

echo ""
echo "3. Verificando pagine principali..."
echo "   - Dashboard operatore..."
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/my-department)
if [[ $DASHBOARD_RESPONSE == "307" ]] || [[ $DASHBOARD_RESPONSE == "302" ]]; then
  echo -e "${GREEN}✓ Pagina protetta${NC}"
else
  echo -e "${YELLOW}⚠ Pagina potrebbe non essere protetta: $DASHBOARD_RESPONSE${NC}"
fi

echo "   - QR Scanner..."
QR_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/qr-scanner)
if [[ $QR_RESPONSE == "307" ]] || [[ $QR_RESPONSE == "302" ]]; then
  echo -e "${GREEN}✓ Pagina protetta${NC}"
else
  echo -e "${YELLOW}⚠ Pagina potrebbe non essere protetta: $QR_RESPONSE${NC}"
fi

echo ""
echo "4. Verificando configurazione database..."
if docker ps | grep -q postgres; then
  echo -e "${GREEN}✓ PostgreSQL in esecuzione${NC}"
else
  echo -e "${RED}✗ PostgreSQL non attivo${NC}"
fi

if docker ps | grep -q redis; then
  echo -e "${GREEN}✓ Redis in esecuzione${NC}"
else
  echo -e "${YELLOW}⚠ Redis non attivo (opzionale)${NC}"
fi

echo ""
echo "=========================="
echo "📋 RIEPILOGO TEST"
echo "=========================="
echo ""
echo "Test completati. Per testare completamente la dashboard:"
echo ""
echo "1. Apri il browser su ${BASE_URL}"
echo "2. Effettua login con uno degli utenti di test:"
echo "   - Operatore: op1.cleanroom@mantaaero.com / password123"
echo "   - Supervisor: capo.cleanroom@mantaaero.com / password123"
echo "   - Admin: admin@mantaaero.com / password123"
echo ""
echo "3. Verifica le seguenti funzionalità:"
echo "   ✓ KPI caricati correttamente"
echo "   ✓ Lista ODL assegnati visibile"
echo "   ✓ Grafico ultimi 7 giorni"
echo "   ✓ Bottone QR Scanner funzionante"
echo "   ✓ Cambio stato ODL"
echo "   ✓ Notifiche di errore/successo"
echo "   ✓ Layout mobile responsive"
echo ""
echo "4. Test QR Scanner:"
echo "   ✓ Accesso alla camera"
echo "   ✓ Scan QR code ODL"
echo "   ✓ Timer automatico su ENTRY"
echo "   ✓ Salvataggio offline"
echo "   ✓ Sync quando torna online"
echo ""