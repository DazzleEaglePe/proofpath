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
├── docs/                  Los cinco documentos de producto. Se leen antes de codear.
├── packages/
│   ├── shared/            @proofpath/shared — canonicalizacion, credentialHash, Merkle.
│   │                      Isomorfico: lo consumen backend Y navegador.
│   └── contracts/         Foundry. TalentPassSBT + AttestationRegistry.
└── apps/
    ├── api/               NestJS + Prisma. Relayer, IA, emision, verificacion.
    ├── web/               Next.js. Dashboard ONG + TalentPass publico + hash roto.
    └── ios/               SwiftUI. Solo si pasa el checkpoint de 04-IOS-APP §6.
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
| Xcode | — | **no instalado**, solo hace falta para `apps/ios` |

Sin Homebrew y sin sudo: todo vive en el home del usuario.

---

## Arranque

```bash
cp .env.example .env          # completar RELAYER_PRIVATE_KEY y OPENAI_API_KEY
pnpm install
pnpm db:up                    # PostgreSQL 17 en :5432
pnpm --filter @proofpath/shared test
pnpm contracts:test
pnpm dev
```

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
4. **Si no esta en `03-DEMO-SCRIPT.md`, no se construye.** → `00-CONTEXT.md §5`
5. **`.env` nunca se commitea**: contiene `RELAYER_PRIVATE_KEY`, que es el minter y el
   issuer del sistema.
