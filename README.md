# ProofPath

Convierte experiencias reales previas al primer empleo en **evidencia verificable de
competencias**, emitida por organizaciones y anclada en Arbitrum.

> **No calificamos personas. Verificamos experiencias.**
> Las reglas innegociables estan en [`docs/00-CONTEXT.md`](docs/00-CONTEXT.md) y mandan
> sobre cualquier decision de implementacion.

---

## Estructura

```
proofpath/
├── docs/                  Contexto, contratos, arquitectura y mapa funcional vivo.
├── packages/
│   ├── shared/            @proofpath/shared — canonicalizacion, credentialHash, Merkle.
│   │                      Isomorfico: lo consumen backend Y navegador.
│   └── contracts/         Foundry. TalentPassSBT + AttestationRegistry.
└── apps/
    ├── api/               NestJS + Prisma. Relayer, IA, emision, verificacion.
    ├── web/               Next.js. Dashboard ONG + TalentPass publico + hash roto.
    └── ios/               SwiftUI. TalentPass, Explorar, Experiencias y Cuenta.
```

`packages/shared` es la pieza mas delicada del repo. La canonicalizacion del VC define el
`credentialHash`, y si backend y frontend divergen un solo byte, **todo verifica en `false`
sin lanzar ningun error**. Por eso tiene un test de oro con el hash fijado como constante,
calculado con una implementacion independiente (`cast keccak` de Foundry).

---

## Requisitos

| Herramienta | Version | Como se instalo aqui |
|---|---|---|
| Node | 24.19.0 LTS | tarball oficial en `~/.local/opt`, symlinks en `~/.local/bin` |
| pnpm | 11.21.0 | `npm i -g pnpm` |
| Foundry | 1.7.1 | `foundryup` → `~/.foundry/bin` |
| Docker | 29.6.2 | Docker Desktop (para PostgreSQL) |
| Rust | 1.97.1 | solo para la ventana Stylus, opcional |
| Xcode | 26.6 | App SwiftUI y simulador iOS 26.5 |

Sin Homebrew y sin sudo: todo vive en el home del usuario.

---

## Arranque

```bash
cp .env.example .env          # completar RELAYER_PRIVATE_KEY y OPENAI_API_KEY
pnpm install
./scripts/dev.sh              # PostgreSQL + API + web, y verifica que respondan
```

`dev.sh` no vuelve hasta confirmar que los tres servicios contestan: si algo no
arranca lo dice ahí, y no el día de la demo. Los procesos quedan desacoplados de
la terminal, así que cerrarla no los mata.

```bash
./scripts/dev.sh --seed       # además resiembra la base
./scripts/stop.sh             # para API y web (PostgreSQL sigue arriba)
```

**Ojo con `--seed`:** borra todos los perfiles, incluidos los creados desde la
app iOS. La app lo maneja —recibe un 401 y vuelve sola al onboarding— pero si es
justo antes de presentar, conviene usar los tres perfiles sembrados, que ya
vienen con experiencias listas para emitir.

Para llenar de contenido **sin borrar nada**:

```bash
pnpm --filter api db:enrich                    # todos los perfiles vacíos
pnpm --filter api db:enrich alguien@correo.com # solo ese
```

Es el complemento de `db:seed`: crea los programas abiertos que alimentan
Explorar y le da tres experiencias —en tres estados distintos— a cada perfil que
no tenga ninguna. Es idempotente y nunca hace un `delete`, así que sirve cuando
ya estás con sesión abierta en el simulador y no querés perderla.

No emite credenciales a propósito: las deja en `ORG_CONFIRMED`, que es el estado
desde el que la ONG emite el batch en vivo. Para verlas verificadas, emitilas
desde el dashboard o con `POST /org/batches/issue`.

Para correr las pruebas:

```bash
pnpm --filter @proofpath/shared test
pnpm --filter api test
pnpm contracts:test
```

El despliegue reproducible del VPS está documentado en
[`docs/09-DEPLOYMENT.md`](docs/09-DEPLOYMENT.md). Usa puertos aislados y procesos
PM2 propios para no interferir con otros proyectos del servidor.

Si `forge` o `pnpm` no se encuentran en una terminal nueva:

```bash
export PATH="$HOME/.local/bin:$HOME/.foundry/bin:$PATH"
```

### App iOS

El `.xcodeproj` se genera con XcodeGen desde `apps/ios/project.yml`. Para abrirla:

```bash
open apps/ios/ProofPath.xcodeproj
```

Para compilar desde terminal sin cambiar las command line tools del sistema:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
  xcodebuild -project apps/ios/ProofPath.xcodeproj -scheme ProofPath \
  -destination 'platform=iOS Simulator,name=iPhone 17' test
```

El `DEVELOPER_DIR` evita tener que correr `sudo xcode-select`.

---

## Reglas que el codigo debe respetar

1. **Ningun score numerico de personas.** Ni en la BD, ni en la API, ni en la UI, ni en los
   slides. Solo conteo de evidencias. → `00-CONTEXT.md §2.1`
2. **La IA propone, el humano confirma.** Ninguna credencial se emite sin
   `SkillClaim.confirmed = true` puesto por la organizacion. → `00-CONTEXT.md §2.2`
3. **Cero PII on-chain.** Ni siquiera cifrada. → `00-CONTEXT.md §4`
4. **Nada de scores opacos en recomendaciones.** Explorar muestra razones legibles y
   nunca califica a la persona. → `00-CONTEXT.md §2.1` y `06-API-SPEC.md §3`
5. **Lo que no está en `03-DEMO-SCRIPT.md` no entra al camino crítico de la demo.** Las
   iteraciones posteriores se registran en `08-MAPA-FUNCIONALIDADES.md`.
6. **`.env` nunca se commitea**: contiene `RELAYER_PRIVATE_KEY`, que es el minter y el
   issuer del sistema.
