#!/usr/bin/env bash
#
# Para la API y el web. PostgreSQL se deja corriendo a proposito: levantarlo de
# nuevo tarda mas y no molesta a nadie.
#
set -uo pipefail

pkill -f "node dist/main.js" 2>/dev/null && echo "  API detenida" || echo "  API no estaba corriendo"
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null && echo "  Web detenido" || echo "  Web no estaba corriendo"

echo "  PostgreSQL sigue arriba (docker compose down para pararlo)"
