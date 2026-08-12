#!/usr/bin/env bash
# Crea una sola vez los secretos privados del VPS sin imprimirlos ni subirlos a Git.
set -euo pipefail

PROOFPATH_ROOT="${PROOFPATH_ROOT:-/var/www/proofpath}"
PROOFPATH_DOMAIN="${PROOFPATH_DOMAIN:-proofpath.ecabot.site}"
ACCESS_FILE="${PROOFPATH_ACCESS_FILE:-/root/proofpath-initial-access.txt}"
SEED_FILE="${PROOFPATH_SEED_FILE:-/root/proofpath-seed.env}"

cd "$PROOFPATH_ROOT"

if [ -e .env ] || [ -e apps/web/.env.local ]; then
  echo "La configuración privada ya existe; no se sobrescribió." >&2
  exit 1
fi

umask 077
postgres_password="$(openssl rand -hex 24)"
jwt_secret="$(openssl rand -hex 32)"
auth_code_secret="$(openssl rand -hex 32)"
wallet_encryption_key="$(openssl rand -hex 32)"
organization_password="$(openssl rand -base64 24 | tr -d '\n')"
talent_password="$(openssl rand -base64 24 | tr -d '\n')"
organization_email="admin@$PROOFPATH_DOMAIN"

{
  printf 'POSTGRES_PASSWORD="%s"\n' "$postgres_password"
  printf 'DATABASE_URL="postgresql://proofpath:%s@127.0.0.1:5434/proofpath?schema=public"\n' "$postgres_password"
  printf '\nJWT_SECRET="%s"\n' "$jwt_secret"
  printf 'AUTH_CODE_SECRET="%s"\n' "$auth_code_secret"
  printf 'WALLET_ENCRYPTION_KEY="%s"\n' "$wallet_encryption_key"
  printf '\nRESEND_API_KEY=""\n'
  printf 'AUTH_EMAIL_FROM="ProofPath <acceso@%s>"\n' "$PROOFPATH_DOMAIN"
  printf '\nCHAIN_ADAPTER="MOCK"\n'
  printf 'ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"\n'
  printf 'RELAYER_PRIVATE_KEY=""\n'
  printf 'TALENTPASS_ADDRESS=""\n'
  printf 'ATTESTATION_REGISTRY_ADDRESS=""\n'
  printf 'ETHERSCAN_API_KEY=""\n'
  printf '\nSKILL_EXTRACTOR="MOCK"\n'
  printf 'OPENAI_API_KEY=""\n'
  printf 'OPENAI_MODEL="gpt-4o-mini"\n'
  printf '\nCORS_ORIGINS="https://%s,http://%s"\n' "$PROOFPATH_DOMAIN" "$PROOFPATH_DOMAIN"
  printf 'HOST="127.0.0.1"\n'
  printf 'PORT="3201"\n'
  printf '\nPINATA_JWT=""\n'
} > .env

{
  printf 'SEED_ORG_EMAIL="%s"\n' "$organization_email"
  printf 'SEED_ORG_PASSWORD="%s"\n' "$organization_password"
  printf 'SEED_TALENT_PASSWORD="%s"\n' "$talent_password"
} > "$SEED_FILE"

{
  printf 'ProofPath — acceso inicial de demo\n\n'
  printf 'Organización\nCorreo: %s\nContraseña: %s\n\n' "$organization_email" "$organization_password"
  printf 'Talentos sembrados\nCorreos: bruno@example.com, camila@example.com, diego@example.com\n'
  printf 'Contraseña compartida: %s\n' "$talent_password"
} > "$ACCESS_FILE"

{
  printf 'NEXT_PUBLIC_API_URL="/api"\n'
  printf 'NEXT_PUBLIC_CHAIN_ID="421614"\n'
  printf 'NEXT_PUBLIC_ARBISCAN_URL="https://sepolia.arbiscan.io"\n'
} > apps/web/.env.local

chmod 600 .env apps/web/.env.local "$ACCESS_FILE" "$SEED_FILE"
echo "Configuración privada creada para $PROOFPATH_DOMAIN."
echo "Acceso inicial guardado con permisos 600 en $ACCESS_FILE."
echo "Variables temporales del seed guardadas en $SEED_FILE."
