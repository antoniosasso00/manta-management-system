#!/bin/bash

# MES Aerospazio - Startup Script
# Questo script permette di avviare l'applicazione in diverse modalità

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Manta Group MES                           ║"
echo "║            Manufacturing Execution System                    ║"
echo "║                   Startup Script                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Funzioni utility
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Funzione per verificare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Funzione per determinare il comando Docker Compose disponibile
get_docker_compose_cmd() {
    if command_exists docker && docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command_exists docker-compose; then
        echo "docker-compose"
    else
        return 1
    fi
}

# Funzione per verificare se una porta è in uso
port_in_use() {
    if command_exists lsof; then
        lsof -i:$1 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep ":$1 " >/dev/null 2>&1
    else
        return 1
    fi
}

# Funzione per terminare processi su una porta
kill_port() {
    local port=$1
    log_info "Terminando processi sulla porta $port..."
    
    if command_exists lsof; then
        local pids=$(lsof -ti:$port)
        if [ ! -z "$pids" ]; then
            echo $pids | xargs kill -9 2>/dev/null || true
            log_success "Processi terminati sulla porta $port"
        fi
    elif command_exists fuser; then
        fuser -k ${port}/tcp 2>/dev/null || true
        log_success "Processi terminati sulla porta $port"
    else
        log_warning "Impossibile terminare processi automaticamente. Usa 'ps aux | grep node' per trovare i processi manualmente."
    fi
}

# Funzione per verificare prerequisiti
check_prerequisites() {
    log_step "Verifica prerequisiti..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dipendenze mancanti: ${missing_deps[*]}"
        echo "Installa le dipendenze mancanti prima di continuare."
        exit 1
    fi
    
    log_success "Prerequisiti verificati"
}

# Funzione per verificare variabili di ambiente
check_env() {
    log_step "Verifica variabili di ambiente..."
    
    if [ ! -f ".env.local" ]; then
        log_warning "File .env.local non trovato"
        echo "Creando .env.local di esempio..."
        cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/mes_aerospazio"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis (opzionale)
REDIS_URL="redis://localhost:6379"

# Email (opzionale)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EOF
        log_warning "File .env.local creato. Modifica le credenziali prima di continuare."
    fi
    
    log_success "Variabili di ambiente verificate"
}

# Funzione per installare dipendenze
install_dependencies() {
    log_step "Installazione dipendenze..."
    
    if [ ! -d "node_modules" ]; then
        log_info "Installando dipendenze npm..."
        npm install
        log_success "Dipendenze installate"
    else
        log_info "Dipendenze già installate"
    fi
}

# Funzione per avviare Docker
start_docker() {
    log_step "Avvio servizi Docker..."
    
    if ! command_exists docker; then
        log_error "Docker non installato"
        exit 1
    fi
    
    local compose_cmd
    if ! compose_cmd=$(get_docker_compose_cmd); then
        log_error "Docker Compose non installato"
        exit 1
    fi
    
    # Ferma eventuali container esistenti
    $compose_cmd down 2>/dev/null || true
    
    # Avvia i servizi
    log_info "Avviando PostgreSQL e Redis..."
    $compose_cmd up -d postgres redis
    
    # Attende che i servizi siano pronti
    log_info "Attendo che i servizi siano pronti..."
    sleep 5
    
    # Verifica che i servizi siano attivi
    if ! $compose_cmd ps | grep -q "Up"; then
        log_error "Errore nell'avvio dei servizi Docker"
        $compose_cmd logs
        exit 1
    fi
    
    log_success "Servizi Docker avviati"
}

# Funzione per setup database
setup_database() {
    log_step "Setup database..."
    
    log_info "Generando client Prisma..."
    npm run db:generate
    
    log_info "Sincronizzando schema database..."
    npm run db:push
    
    log_success "Database configurato"
}

# Funzione per avvio modalità sviluppo
start_development() {
    log_step "Avvio modalità sviluppo..."
    
    # Controlla se la porta 3000 è in uso
    if port_in_use 3000; then
        log_warning "Porta 3000 già in uso"
        kill_port 3000
        sleep 2
    fi
    
    log_info "Avviando server di sviluppo..."
    echo -e "${GREEN}Server disponibile su: http://localhost:3000${NC}"
    echo -e "${GREEN}Registrazione utente: http://localhost:3000/register${NC}"
    echo -e "${YELLOW}Premi Ctrl+C per terminare${NC}"
    echo ""
    
    npm run dev
}

# Funzione per avvio modalità produzione
start_production() {
    log_step "Avvio modalità produzione..."
    
    log_info "Building applicazione..."
    npm run build
    
    # Controlla se la porta 3000 è in uso
    if port_in_use 3000; then
        log_warning "Porta 3000 già in uso"
        kill_port 3000
        sleep 2
    fi
    
    log_info "Avviando server di produzione..."
    echo -e "${GREEN}Server disponibile su: http://localhost:3000${NC}"
    echo -e "${YELLOW}Premi Ctrl+C per terminare${NC}"
    echo ""
    
    npm run start
}

# Funzione per avvio Docker completo
start_docker_full() {
    log_step "Avvio completo con Docker..."
    
    if ! command_exists docker; then
        log_error "Docker non installato"
        exit 1
    fi
    
    local compose_cmd
    if ! compose_cmd=$(get_docker_compose_cmd); then
        log_error "Docker Compose non installato"
        exit 1
    fi
    
    # Ferma eventuali container esistenti
    $compose_cmd down 2>/dev/null || true
    
    log_info "Building e avvio di tutti i servizi..."
    $compose_cmd up --build -d
    
    log_info "Attendo che i servizi siano pronti..."
    sleep 10
    
    # Verifica che i servizi siano attivi
    if ! $compose_cmd ps | grep -q "Up"; then
        log_error "Errore nell'avvio dei servizi Docker"
        $compose_cmd logs
        exit 1
    fi
    
    log_success "Tutti i servizi Docker avviati"
    echo -e "${GREEN}Applicazione disponibile su: http://localhost:3000${NC}"
    echo -e "${GREEN}Database disponibile su: localhost:5432${NC}"
    echo -e "${GREEN}Redis disponibile su: localhost:6379${NC}"
    echo ""
    echo "Comandi utili:"
    echo "  $compose_cmd logs -f        # Visualizza i log"
    echo "  $compose_cmd stop           # Ferma i servizi"
    echo "  $compose_cmd down           # Ferma e rimuove i container"
}

# Funzione per cleanup
cleanup() {
    log_step "Pulizia risorse..."
    
    # Termina processi Node.js
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm run start" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next start" 2>/dev/null || true
    
    # Ferma Docker se richiesto
    if [ "$1" = "docker" ]; then
        local compose_cmd
        if compose_cmd=$(get_docker_compose_cmd); then
            $compose_cmd down 2>/dev/null || true
            log_success "Servizi Docker fermati"
        fi
    fi
    
    log_success "Pulizia completata"
}

# Funzione per mostrare status
show_status() {
    log_step "Status servizi..."
    
    echo -e "${CYAN}Porte in uso:${NC}"
    if port_in_use 3000; then
        echo -e "  ✅ Porta 3000 (Next.js) - ${GREEN}ATTIVA${NC}"
    else
        echo -e "  ❌ Porta 3000 (Next.js) - ${RED}INATTIVA${NC}"
    fi
    
    if port_in_use 5432; then
        echo -e "  ✅ Porta 5432 (PostgreSQL) - ${GREEN}ATTIVA${NC}"
    else
        echo -e "  ❌ Porta 5432 (PostgreSQL) - ${RED}INATTIVA${NC}"
    fi
    
    if port_in_use 6379; then
        echo -e "  ✅ Porta 6379 (Redis) - ${GREEN}ATTIVA${NC}"
    else
        echo -e "  ❌ Porta 6379 (Redis) - ${RED}INATTIVA${NC}"
    fi
    
    echo ""
    
    local compose_cmd
    if compose_cmd=$(get_docker_compose_cmd); then
        echo -e "${CYAN}Docker Compose Status:${NC}"
        if $compose_cmd ps 2>/dev/null | grep -q "Up"; then
            $compose_cmd ps
        else
            echo -e "  ${YELLOW}Nessun servizio Docker attivo${NC}"
        fi
    fi
}

# Funzione per mostrare help
show_help() {
    echo -e "${CYAN}Utilizzo:${NC}"
    echo "  ./start.sh [opzione]"
    echo ""
    echo -e "${CYAN}Opzioni disponibili:${NC}"
    echo "  dev        - Avvio in modalità sviluppo (default)"
    echo "  prod       - Avvio in modalità produzione"
    echo "  docker     - Avvio completo con Docker"
    echo "  services   - Avvio solo servizi Docker (DB + Redis)"
    echo "  setup      - Setup iniziale progetto"
    echo "  clean      - Pulizia processi e risorse"
    echo "  status     - Mostra status servizi"
    echo "  help       - Mostra questo aiuto"
    echo ""
    echo -e "${CYAN}Esempi:${NC}"
    echo "  ./start.sh              # Avvio sviluppo"
    echo "  ./start.sh dev          # Avvio sviluppo"
    echo "  ./start.sh prod         # Avvio produzione"
    echo "  ./start.sh docker       # Avvio completo Docker"
    echo "  ./start.sh services     # Solo DB + Redis"
    echo "  ./start.sh setup        # Setup iniziale"
    echo ""
    echo -e "${CYAN}Note:${NC}"
    echo "  - Modifica .env.local per le credenziali"
    echo "  - Usa Ctrl+C per terminare i servizi"
    echo "  - Per il primo avvio usa: ./start.sh setup"
}

# Funzione per setup iniziale
initial_setup() {
    log_step "Setup iniziale progetto..."
    
    check_prerequisites
    check_env
    install_dependencies
    start_docker
    setup_database
    
    log_success "Setup completato!"
    echo ""
    echo -e "${GREEN}Prossimi passi:${NC}"
    echo "1. Modifica .env.local con le tue credenziali"
    echo "2. Avvia l'applicazione con: ./start.sh dev"
    echo "3. Vai su http://localhost:3000/register per creare il primo utente"
}

# Menu interattivo
show_menu() {
    echo -e "${CYAN}Seleziona modalità di avvio:${NC}"
    echo "1) Sviluppo (npm run dev)"
    echo "2) Produzione (npm run build + start)"
    echo "3) Docker completo"
    echo "4) Solo servizi Docker (DB + Redis)"
    echo "5) Setup iniziale"
    echo "6) Pulizia risorse"
    echo "7) Status servizi"
    echo "8) Aiuto"
    echo "9) Esci"
    echo ""
    read -p "Scelta [1-9]: " choice
    
    case $choice in
        1)
            MODE="dev"
            ;;
        2)
            MODE="prod"
            ;;
        3)
            MODE="docker"
            ;;
        4)
            MODE="services"
            ;;
        5)
            MODE="setup"
            ;;
        6)
            MODE="clean"
            ;;
        7)
            MODE="status"
            ;;
        8)
            MODE="help"
            ;;
        9)
            log_info "Uscita..."
            exit 0
            ;;
        *)
            log_error "Scelta non valida"
            exit 1
            ;;
    esac
}

# Gestione segnali
trap 'log_info "Ricevuto segnale di interruzione..."; cleanup; exit 0' INT TERM

# Main
main() {
    # Determina modalità
    if [ $# -eq 0 ]; then
        show_menu
    else
        MODE=$1
    fi
    
    case $MODE in
        "dev"|"development")
            check_prerequisites
            install_dependencies
            start_docker
            setup_database
            start_development
            ;;
        "prod"|"production")
            check_prerequisites
            install_dependencies
            start_docker
            setup_database
            start_production
            ;;
        "docker")
            start_docker_full
            ;;
        "services")
            start_docker
            ;;
        "setup")
            initial_setup
            ;;
        "clean")
            cleanup docker
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Modalità non riconosciuta: $MODE"
            show_help
            exit 1
            ;;
    esac
}

# Avvio script
main "$@"