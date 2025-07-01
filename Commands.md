📋 Comandi di Sviluppo Utili

  Database Management

  # Visualizza database con Prisma Studio
  npm run db:studio

  # Genera client Prisma dopo modifiche schema
  npm run db:generate

  # Visualizza logs database
  docker compose logs postgres

  # Stop database
  docker compose down

  Build e Test

  # Build produzione
  npm run build

  # Start produzione
  npm run start

  # Linting
  npm run lint

  Debug e Monitoring

  # Logs container database
  docker compose logs -f postgres

  # Status containers
  docker compose ps

  # Restart database
  docker compose restart postgres

  ---
  ⚡ Quick Start (Sequenza Completa)

  # 1. Avvia tutto in sequenza
  docker compose up -d && npm run db:push && npm run dev

  # 2. Apri browser su http://localhost:3000

  # 3. Vai su /register per creare primo admin

  ---
  🔧 Troubleshooting

  Se hai problemi:

  1. Database non si connette:
  docker compose down
  docker compose up -d
  2. Schema non sincronizzato:
  npm run db:push
  3. Port 3000 occupato:
  npm run dev -- -p 3001

  L'app sarà disponibile su http://localhost:3000 con il sistema di autenticazione
  completo pronto all'uso!

  # Basic usage
ccusage          # Show daily report (default)
ccusage daily    # Daily token usage and costs
ccusage monthly  # Monthly aggregated report
ccusage session  # Usage by conversation session
ccusage blocks   # 5-hour billing windows

# Live monitoring
ccusage blocks --live  # Real-time usage dashboard

# Filters and options
ccusage daily --since 20250525 --until 20250530
ccusage daily --json  # JSON output
ccusage daily --breakdown  # Per-model cost breakdown