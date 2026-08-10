#!/usr/bin/env bash
#
# Levanta los tres servicios de desarrollo y no vuelve hasta confirmar que
# responden. Pensado para el dia de la demo: un comando, y si algo no arranca lo
# dice en vez de dejarte descubrirlo en el escenario.
#
#   ./scripts/dev.sh          arranca todo
#   ./scripts/dev.sh --seed   arranca y resiembra la base (borra los perfiles
#                             creados desde la app)
#
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH"

verde() { printf '\033[32m%s\033[0m\n' "$1"; }
rojo()  { printf '\033[31m%s\033[0m\n' "$1"; }
gris()  { printf '\033[90m%s\033[0m\n' "$1"; }

esperar() { # url, nombre, intentos
  for _ in $(seq 1 "$3"); do
    if curl -s -o /dev/null -m 3 "$1"; then verde "  ✓ $2"; return 0; fi
    sleep 1
  done
  rojo "  ✗ $2 no respondio"
  return 1
}

# ─── PostgreSQL ─────────────────────────────────────────────
gris "PostgreSQL…"
if ! docker ps --filter name=proofpath-db --format '{{.Names}}' | grep -q proofpath-db; then
  (cd "$RAIZ" && docker compose up -d >/dev/null 2>&1)
fi
for _ in $(seq 1 30); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' proofpath-db 2>/dev/null)" = healthy ] && break
  sleep 1
done
verde "  ✓ PostgreSQL :5433"

# ─── Seed opcional ──────────────────────────────────────────
if [ "${1:-}" = "--seed" ]; then
  gris "Resembrando…"
  (cd "$RAIZ" && pnpm --filter api db:seed 2>&1 | grep -E "TalentPass #|Login|Listo" | sed 's/^/  /')
fi

# ─── API ────────────────────────────────────────────────────
gris "API…"
pkill -f "node dist/main.js" 2>/dev/null
sleep 1
# Los tres descriptores van a archivo o a /dev/null. Sin cerrar stdin y stdout,
# el proceso hereda la salida del script y cualquier cosa que lea de ahi
# (una tuberia, por ejemplo) se queda esperando para siempre.
cd "$RAIZ/apps/api" || exit 1
nohup node dist/main.js </dev/null >/tmp/proofpath-api.log 2>&1 &
disown
cd "$RAIZ" || exit 1
esperar http://localhost:3001/health "API :3001" 25

# ─── Web ────────────────────────────────────────────────────
gris "Web…"
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1
cd "$RAIZ/apps/web" || exit 1
nohup pnpm dev -p 3000 </dev/null >/tmp/proofpath-web.log 2>&1 &
disown
cd "$RAIZ" || exit 1
esperar http://localhost:3000/ "Web :3000" 40

# ─── Resumen ────────────────────────────────────────────────
echo
curl -s -m 3 http://localhost:3001/health | sed 's/^/  /'
echo
gris "  Dashboard ONG   http://localhost:3000/org/login"
gris "                  contacto@impulsojoven.org / impulsojoven2026"
gris "  TalentPass      http://localhost:3000/talento/1"
echo
gris "  Logs: /tmp/proofpath-api.log · /tmp/proofpath-web.log"
gris "  Parar: ./scripts/stop.sh"
