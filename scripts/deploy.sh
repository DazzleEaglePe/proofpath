#!/usr/bin/env bash
#
# Despliega TalentPassSBT + AttestationRegistry a Arbitrum Sepolia y deja el
# .env apuntando a la cadena real. Pensado para correrse una sola vez, con
# prisa, el dia del submit: comprueba antes de gastar, y escribe el .env el
# mismo para que nadie copie una direccion a mano a las 13:40.
#
#   ./scripts/deploy.sh           despliega y actualiza el .env
#   ./scripts/deploy.sh --check   solo mira el balance y sale (no gasta nada)
#
# Requiere Foundry (forge/cast) — vive en la Mac, no en la maquina Windows.
# Requiere RELAYER_PRIVATE_KEY con fondos. Sin fondos, el faucet es el bloqueo:
# el script te lo dice y se detiene en vez de fallar a medias.
#
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH"

ENV="$RAIZ/.env"
SOLO_CHECK=0
[[ "${1:-}" == "--check" ]] && SOLO_CHECK=1

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
info()  { printf '\033[36m%s\033[0m\n' "$*"; }

# ─── Comprobaciones previas ─────────────────────────────────

command -v forge >/dev/null || { rojo "No hay Foundry en el PATH. Esto corre en la Mac."; exit 1; }
[[ -f "$ENV" ]] || { rojo "Falta $ENV. Copialo de .env.example y completalo."; exit 1; }

set -a; source "$ENV"; set +a

RPC="${ARBITRUM_SEPOLIA_RPC:-https://sepolia-rollup.arbitrum.io/rpc}"

if [[ -z "${RELAYER_PRIVATE_KEY:-}" ]]; then
  rojo "RELAYER_PRIVATE_KEY vacia en .env. Sin eso no hay despliegue."
  exit 1
fi

RELAYER="$(cast wallet address --private-key "$RELAYER_PRIVATE_KEY")"
BALANCE="$(cast balance "$RELAYER" --rpc-url "$RPC")"

info "Relayer: $RELAYER"
info "Balance: $(cast from-wei "$BALANCE") ETH  (Arbitrum Sepolia)"

# El despliegue de los dos contratos mas la tx de setTrustedIssuer entra
# comodo en 0.005 ETH. Por debajo de eso no vale la pena intentarlo: se
# gasta la mitad, revierte, y hay que volver al faucet igual.
MINIMO="5000000000000000"

if [[ "$BALANCE" == "0" ]]; then
  rojo ""
  rojo "BLOQUEADO: el relayer no tiene fondos."
  rojo ""
  echo "Opciones, en orden de rapidez:"
  echo "  1. Discord del hackathon — los sponsors de Arbitrum fondean en minutos."
  echo "  2. Faucet de Alchemy o QuickNode (piden cuenta)."
  echo "  3. Bridge de Sepolia L1 -> Arbitrum Sepolia (el mas lento, ~10 min)."
  echo ""
  echo "Direccion a fondear:  $RELAYER"
  exit 1
fi

if [[ "$(echo "$BALANCE < $MINIMO" | bc)" == "1" ]]; then
  rojo "Balance por debajo del minimo seguro (0.005 ETH). Fondea mas antes de gastar."
  exit 1
fi

verde "Fondos suficientes."
[[ $SOLO_CHECK == 1 ]] && exit 0

# ─── Despliegue ─────────────────────────────────────────────

info ""
info "Desplegando..."

SALIDA="$(cd "$RAIZ/packages/contracts" && forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC" --broadcast -vvvv 2>&1)"

echo "$SALIDA"

PASS="$(echo "$SALIDA"     | grep -oE 'TALENTPASS_ADDRESS=0x[a-fA-F0-9]{40}'          | tail -1 | cut -d= -f2)"
REGISTRY="$(echo "$SALIDA" | grep -oE 'ATTESTATION_REGISTRY_ADDRESS=0x[a-fA-F0-9]{40}' | tail -1 | cut -d= -f2)"

if [[ -z "$PASS" || -z "$REGISTRY" ]]; then
  rojo ""
  rojo "El despliegue no devolvio las dos direcciones. Revisa la salida de arriba."
  rojo "Si las tx si pasaron, copialas a mano al .env y pon CHAIN_ADAPTER=ARBITRUM."
  exit 1
fi

# ─── Escribir el .env ───────────────────────────────────────
#
# Se toca el .env real, asi que primero una copia con fecha. Si algo sale
# torcido a esta altura del dia, no se pierde la configuracion que si servia.

cp "$ENV" "$ENV.bak.$(date +%H%M%S)"

fijar() {
  local clave="$1" valor="$2"
  if grep -qE "^${clave}=" "$ENV"; then
    # Delimitador | porque las direcciones no lo contienen y el / si aparece en URLs.
    sed -i.tmp -E "s|^${clave}=.*|${clave}=\"${valor}\"|" "$ENV" && rm -f "$ENV.tmp"
  else
    echo "${clave}=\"${valor}\"" >> "$ENV"
  fi
}

fijar TALENTPASS_ADDRESS "$PASS"
fijar ATTESTATION_REGISTRY_ADDRESS "$REGISTRY"
fijar CHAIN_ADAPTER "ARBITRUM"

verde ""
verde "Desplegado y .env actualizado:"
echo "  TALENTPASS_ADDRESS=$PASS"
echo "  ATTESTATION_REGISTRY_ADDRESS=$REGISTRY"
echo "  CHAIN_ADAPTER=ARBITRUM"
echo ""
echo "  https://sepolia.arbiscan.io/address/$REGISTRY"
echo ""
info "Ahora:  ./scripts/dev.sh --seed"
info "Y confirma en GET /health que el adapter dice ARBITRUM antes de grabar."
