# ProofPath — DEPLOYMENT VPS

## Estado del entorno — 12 de agosto de 2026

- Fuente desplegada en `/var/www/proofpath` del VPS `38.29.171.92`.
- `proofpath-web`, `proofpath-api` y `proofpath-postgres` están operativos.
- La landing y la API están publicadas en `https://proofpath.ecabot.site` y
  `https://proofpath.ecabot.site/api`, respectivamente.
- El registro DNS `A` apunta a `38.29.171.92`; Let’s Encrypt está activo, HTTP
  redirige a HTTPS y Certbot tiene habilitada la renovación automática.
- El adaptador blockchain y el extractor de skills siguen en `MOCK`.
- Resend, OpenAI y el despliegue de contratos en Arbitrum Sepolia siguen
  pendientes de credenciales/fondos externos.
- El acceso inicial no está en Git: permanece en
  `/root/proofpath-initial-access.txt` con permisos `600`.

Topología de producción para convivir con otros proyectos del VPS sin tocar sus
procesos ni sus puertos:

| Componente | Bind interno | Exposición |
|---|---:|---|
| Next.js | `127.0.0.1:3200` | Nginx `/` |
| NestJS | `127.0.0.1:3201` | Nginx `/api/` |
| PostgreSQL 17 | `127.0.0.1:5434` | solo host |
| Nginx | `80/443` | dominio público |

PM2 usa los nombres `proofpath-web` y `proofpath-api`; no reutiliza
`eca-dashboard`.

El VPS conserva Node 20 para el dashboard existente. ProofPath usa Node 24
desde `/opt/node-v24` mediante un intérprete explícito en PM2, por lo que no se
reemplaza el runtime global del servidor.

## 1. DNS y HTTPS

1. Crear un registro `A` del dominio elegido hacia `38.29.171.92`.
2. Copiar `deploy/nginx/proofpath.conf.template`, sustituyendo
   `__PROOFPATH_DOMAIN__`.
3. Validar con `nginx -t` antes de recargar.
4. Emitir el certificado TLS únicamente después de que el DNS resuelva.

Estado actual: el registro `A` de `proofpath.ecabot.site` ya resuelve al VPS y
el certificado TLS se emitió el 12 de agosto de 2026. El certificado vigente
expira el 10 de noviembre de 2026 y Certbot lo renovará automáticamente.

La web y la app consumen la misma base pública: `https://DOMINIO/api`. Así se
evita mantener un segundo subdominio y el navegador usa llamadas same-origin.

## 2. Variables privadas del servidor

El archivo `/var/www/proofpath/.env` no entra a Git. Debe contener como mínimo:

```dotenv
POSTGRES_PASSWORD="GENERAR_UNO_NUEVO"
DATABASE_URL="postgresql://proofpath:GENERAR_UNO_NUEVO@127.0.0.1:5434/proofpath?schema=public"

JWT_SECRET="GENERAR_32_BYTES"
AUTH_CODE_SECRET="GENERAR_32_BYTES_DISTINTOS"
WALLET_ENCRYPTION_KEY="GENERAR_32_BYTES_HEX"

RESEND_API_KEY=""
AUTH_EMAIL_FROM="ProofPath <acceso@DOMINIO>"

CHAIN_ADAPTER="MOCK"
ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
RELAYER_PRIVATE_KEY=""
TALENTPASS_ADDRESS=""
ATTESTATION_REGISTRY_ADDRESS=""
ETHERSCAN_API_KEY=""

SKILL_EXTRACTOR="MOCK"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"

CORS_ORIGINS="https://DOMINIO"
HOST="127.0.0.1"
PORT="3201"
```

Generar secretos independientes; no reutilizar contraseñas personales ni la del
acceso SSH.

Las variables `SEED_*` se usan únicamente para la primera carga de datos de la
demo. El proceso no imprime contraseñas y el seed no debe repetirse sobre una
base con información real porque reinicia sus tablas.

Después de ejecutar el seed inicial, retirar las variables `SEED_*` del `.env`.
Las contraseñas ya quedan hasheadas en PostgreSQL y el acceso legible permanece
solo en el archivo `600` de root.

En la primera instalación, `scripts/configure-vps-env.sh` puede generarlas sin
mostrarlas. Guarda el acceso inicial en
`/root/proofpath-initial-access.txt` y las variables temporales en
`/root/proofpath-seed.env`, ambos con permisos `600`; además se niega a
sobrescribir una configuración existente. El seed se ejecuta cargando ese
archivo y `proofpath-seed.env` se elimina al terminar.

`/var/www/proofpath/apps/web/.env.local` se crea antes del build:

```dotenv
NEXT_PUBLIC_API_URL="/api"
NEXT_PUBLIC_CHAIN_ID="421614"
NEXT_PUBLIC_ARBISCAN_URL="https://sepolia.arbiscan.io"
```

## 3. Primera instalación

```bash
cd /var/www
git clone https://github.com/DazzleEaglePe/proofpath.git
cd proofpath
# crear .env y apps/web/.env.local sin subirlos a Git
./scripts/deploy-vps.sh
```

Después se instala el virtual host de Nginx, se valida con `nginx -t` y se
recarga Nginx. Nunca se reemplaza el `default` ni la configuración de otro sitio.

## 4. Actualizaciones

```bash
cd /var/www/proofpath
./scripts/deploy-vps.sh
```

El script cancela si encuentra cambios remotos sin guardar, usa `pull --ff-only`,
aplica migraciones ya versionadas y valida API y web antes de terminar.
También acepta una fuente sincronizada mediante `rsync`; en ese caso no intenta
operaciones Git y despliega exactamente el contenido presente en el VPS.

## 5. Arbitrum Sepolia

No existe un registro obligatorio de “desarrollador Arbitrum”. Para pruebas se
puede usar el RPC público y una EOA financiada con ETH de testnet. Antes de pasar
`CHAIN_ADAPTER` a `ARBITRUM`:

1. Fondear la dirección del relayer en Arbitrum Sepolia.
2. Ejecutar el script Foundry de despliegue.
3. Guardar las dos direcciones desplegadas en `.env`.
4. Configurar `ETHERSCAN_API_KEY` y verificar los contratos en el explorer. La
   clave del explorer no es necesaria para enviar el despliegue; solo para
   publicar y verificar el código fuente.
5. Reiniciar `proofpath-api` con `--update-env`.
6. Confirmar que `/api/health` informa `chainAdapter: arbitrum`.

El RPC público sirve para demo y bajo volumen. Para operación sostenida se usa
un proveedor con credenciales y fallback, porque el endpoint público no ofrece
SLA.
