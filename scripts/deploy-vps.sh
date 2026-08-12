#!/usr/bin/env bash
# Actualización reproducible de ProofPath en el VPS.
# Se ejecuta DENTRO del servidor después de crear /var/www/proofpath/.env y
# apps/web/.env.local. No crea ni imprime secretos.
set -euo pipefail

PROOFPATH_ROOT="${PROOFPATH_ROOT:-/var/www/proofpath}"
PROOFPATH_BRANCH="${PROOFPATH_BRANCH:-main}"
PROOFPATH_NODE_ROOT="${PROOFPATH_NODE_ROOT:-/opt/node-v24}"
PROOFPATH_PNPM_ROOT="${PROOFPATH_PNPM_ROOT:-/opt/pnpm}"

export PATH="$PROOFPATH_NODE_ROOT/bin:$PROOFPATH_PNPM_ROOT/bin:$PATH"

cd "$PROOFPATH_ROOT"

if [ -d .git ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "El checkout remoto tiene cambios sin guardar; despliegue cancelado." >&2
    exit 1
  fi

  git fetch origin "$PROOFPATH_BRANCH"
  git checkout "$PROOFPATH_BRANCH"
  git pull --ff-only origin "$PROOFPATH_BRANCH"
else
  echo "Fuente sincronizada sin Git; se desplegará el contenido actual."
fi

pnpm install --frozen-lockfile

docker compose --env-file .env -f deploy/docker-compose.production.yml up -d --wait

pnpm --filter @proofpath/shared build
pnpm --filter api build
pnpm --filter web build
pnpm --filter api exec prisma migrate deploy

PROOFPATH_ROOT="$PROOFPATH_ROOT" \
PROOFPATH_NODE="$PROOFPATH_NODE_ROOT/bin/node" \
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

curl --fail --silent --show-error http://127.0.0.1:3201/health
curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3200/

echo
echo "ProofPath actualizado: web :3200 · API :3201 · PostgreSQL :5434 (solo localhost)"
