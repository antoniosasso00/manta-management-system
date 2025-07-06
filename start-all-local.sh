#!/bin/bash

echo "🚀 AVVIO SISTEMA MES COMPLETO LOCALE"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    echo -e "${BLUE}Controllo $name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name RUNNING${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Tentativo $attempt/$max_attempts per $name...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name NON DISPONIBILE${NC}"
    return 1
}

echo -e "\n${BLUE}1. 🗄️  AVVIO DATABASE (PostgreSQL + Redis)${NC}"
docker compose up -d
echo -e "${GREEN}✅ Database containers avviati${NC}"

echo -e "\n${BLUE}2. 🐍 AVVIO MICROSERVIZIO PYTHON${NC}"
cd manta-optimization-service
docker compose -f docker-compose.dev.yml up -d --build
cd ..
echo -e "${GREEN}✅ Microservizio optimization avviato${NC}"

echo -e "\n${BLUE}3. 📊 SETUP DATABASE SCHEMA E DATI${NC}"
npm run db:push > /dev/null 2>&1
echo -e "${GREEN}✅ Schema database applicato${NC}"

npm run db:seed-complete > /dev/null 2>&1
echo -e "${GREEN}✅ Dati di test caricati${NC}"

echo -e "\n${BLUE}4. ⚙️  CONFIGURAZIONE ENVIRONMENT${NC}"
# Assicurati che OPTIMIZATION_SERVICE_URL sia configurato
if ! grep -q "OPTIMIZATION_SERVICE_URL=http://localhost:8000" .env.local 2>/dev/null; then
    echo "OPTIMIZATION_SERVICE_URL=http://localhost:8000" >> .env.local
fi
echo -e "${GREEN}✅ Environment configurato${NC}"

echo -e "\n${BLUE}5. 🌐 CONTROLLO SERVIZI${NC}"
sleep 5

# Check database
if docker compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL RUNNING${NC}"
else
    echo -e "${RED}❌ PostgreSQL NON RUNNING${NC}"
fi

# Check microservice
check_service "http://localhost:8000/api/v1/health/" "Microservizio Python"

echo -e "\n${BLUE}6. 🚀 AVVIO NEXT.JS${NC}"
echo -e "${YELLOW}⚠️  NOTA: Next.js si avvierà in modalità interattiva${NC}"
echo -e "${YELLOW}   Premi Ctrl+C per fermare quando hai finito i test${NC}"
echo -e "\n${GREEN}📍 URLs DISPONIBILI:${NC}"
echo -e "   🌐 App Next.js:        http://localhost:3001"
echo -e "   🐍 Microservizio:      http://localhost:8000"
echo -e "   📚 API Docs:           http://localhost:8000/docs"
echo -e "   🗄️  Database Studio:    http://localhost:5555 (npm run db:studio)"
echo -e "\n${GREEN}🔑 LOGIN TEST:${NC}"
echo -e "   Email: admin@mantaaero.com"
echo -e "   Password: password123"
echo -e "\n${GREEN}🎯 TEST OTTIMIZZAZIONE:${NC}"
echo -e "   Vai su: http://localhost:3001/autoclavi/optimization"
echo -e "\n${BLUE}Avvio Next.js...${NC}"
npm run dev -- -p 3001