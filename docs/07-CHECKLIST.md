# ProofPath — CHECKLIST

> Estado vivo del proyecto. Se actualiza al cerrar cada bloque.
> El calendario manda es el de `04-IOS-APP.md §5` (bloques reales), no las 48h
> contiguas de `03-DEMO-SCRIPT.md §5`.

**Submit:** miércoles 15:00 → **subir a las 14:00**. El último tramo siempre se
complica y la plataforma se satura.

---

## 1. Estado actual

### Hecho

- [x] Mac provisionada: Node 24.19.0, pnpm 11.21.0, Foundry 1.7.1, Rust 1.97.1,
      Docker + PostgreSQL 17. Todo sin sudo, dentro del home.
- [x] Xcode 26.6 instalado (simulador iOS 26.5 descargando aparte)
- [x] Monorepo pnpm: `apps/api`, `apps/web`, `packages/shared`, `packages/contracts`
- [x] Repo público en `github.com/DazzleEaglePe/proofpath`
- [x] Canonicalización del VC + `credentialHash` con test de oro
      (constante calculada con `cast keccak`, implementación independiente)
- [x] `TalentPassSBT` + `AttestationRegistry` + 13 tests Foundry
- [x] Merkle en `packages/shared` cruzado contra el contrato (17 tests)
- [x] Script de despliegue escrito
- [x] Relayer generado: `0x550Ed57afa9Cac4592C28743cE36cBefd01Eb292`
- [x] `06-API-SPEC.md` — contratos de API, camelCase fijado
- [x] Schema Prisma + migraciones de autenticación, perfil progresivo y oportunidades
      aplicadas en PostgreSQL local
- [x] `ChainAdapter` con `ArbitrumAdapter` y `MockChainAdapter` (9 tests)
- [x] `GET /health` dice en qué modo está la cadena
- [x] Repositorios sobre Prisma (los servicios no tocan Prisma directo)
- [x] **Emisión de batch end-to-end**: `POST /org/batches/issue` probado contra
      Postgres real — 3 credenciales, un batch, experiencias a `ISSUED`
- [x] Seed reiniciable con `pnpm --filter api db:seed`
- [x] **Pipeline IA propone → ONG confirma → emisión**, probado en vivo: de 7
      skills propuestas, solo las 4 confirmadas entraron al VC
- [x] `apps/ios/` reservada (el proyecto se crea tras el checkpoint del martes)
- [x] **Verificación pública**: devuelve el VC crudo + proof + estado on-chain.
      Probado editando un carácter en Postgres → `verified: false`

### Bloqueado

- [ ] **Fondear el relayer con ETH de Arbitrum Sepolia** ← lo único que frena el deploy

- [x] **Registro y acceso de talento**: nombres/apellidos estructurados, contraseña
      scrypt, verificación de correo, login y recuperación con código.
- [x] **Wallet embebida** con cifrado AES-256-GCM y export de llave. Se activa al
      verificar el correo; el usuario nunca ve la palabra wallet.
- [x] **Auth JWT** con audiencias `talent` y `org`, y comprobación de pertenencia:
      una ONG no puede tocar experiencias de otra aunque conozca los ids
- [x] **Backend del flujo web completo.** Login ONG → skills IA → confirmar →
      emitir → verificar, todo probado end-to-end

- [x] Endpoints `/me/*` del talento
- [x] **Frontend web**: dashboard ONG, TalentPass público y la pantalla del hash
      roto, que recomputa el hash en el navegador
- [x] **App iOS**: registro, login, recuperación, navegación inferior, TalentPass,
      Explorar con recomendación explicable, historial filtrable, selector de programas
      y Mi cuenta con perfil progresivo/cierre de sesión; compila y pasa sus tests.
- [x] **Descubrimiento de oportunidades**: perfil privado de formación e intereses,
      programas abiertos enriquecidos y recomendador determinista sin score público.

- [x] **Módulo Stylus**: compila a wasm (8.5 KB) y pasa `cargo stylus check`.
      El Rust reproduce exactamente las hojas y el root de Solidity y TypeScript.
      Activación estimada: 0.000079 ETH.
- [x] Envoltorios de benchmark de gas escritos, listos para correr tras el deploy

### En curso

- [ ] Ensayos cronometrados y video de respaldo
- [ ] Correr el benchmark de gas (necesita el deploy, o sea el faucet)
- [x] Endpoint de verificación pública
- [x] Auth JWT con audiencias `talent` y `org`, incluido guard de emisión

---

## 2. Camino crítico

Lo que, si falla, mata la demo. En orden de dependencia:

```
canonicalización + hash    ✅ hecho, con test de oro
        ↓
contratos + Merkle          ✅ hecho, cruzado entre Solidity y TS
        ↓
deploy en Sepolia           ⛔ esperando faucet
        ↓
emisión de batch end-to-end
        ↓
verificación pública
        ↓
LA PANTALLA DEL HASH ROTO   ← nunca se sacrifica (03-DEMO-SCRIPT §2)
```

Todo lo que no está en esta columna es negociable si el tiempo aprieta.

---

## 3. Bloques por persona

### Dev 1 (Bruno) — chain, backend, iOS

- [x] **Dom tarde** · Provisionar Mac + contratos Solidity + tests
- [ ] **Dom noche** · Backend: canonicalización, hash, Merkle, endpoint de emisión
- [ ] **Lun día** · Endpoint de verificación + relayer
- [ ] **Lun noche** · `MockChainAdapter` + seed + **ventana Stylus**
- [ ] **Mar día** · Integración con el front. **Checkpoint: flujo web completo**
- [ ] **Mar noche** · App iOS (solo si pasó el checkpoint)
- [ ] **Mié mañana** · Ensayos, video de respaldo, submit antes de las 14:00

### Dev 2 — frontend web

- [ ] Scaffold + embedded wallet
- [ ] Pantalla ONG: programa → skills propuestas por IA → confirmar → emitir batch
- [ ] TalentPass público con badge de verificación
- [ ] **La pantalla del hash roto** ← lo último que se sacrifica
- [ ] Pulido, responsive, ensayos

### UX de producto

- [ ] El guion visual de la demo: los 5 pantallazos exactos, en orden
- [ ] Que el badge rojo se vea desde el fondo de la sala
- [ ] Después, si sobra tiempo, pulir

### Economía

- [ ] Costo de una mala contratación junior en Perú — **con fuente**
- [ ] Time-to-hire junior/trainee y costo por semana de vacancia — **con fuente**
- [ ] TAM: egresados anuales × % subempleo profesional — **con fuente**
- [ ] Armar slides y **presentar el bloque de negocio en vivo**

> Ningún número sin fuente. Los jurados de LATAM castigan las cifras inventadas
> más de lo que premian las grandes.

---

## 4. Puertas de decisión

Se deciden por reloj, no por sensación. Escritas antes para no negociarlas en el momento.

| Cuándo | Puerta | Si no se cumple |
|---|---|---|
| Lun noche | Módulo Stylus desplegado | Se archiva la rama. El benchmark pasa a slide de roadmap. **No se negocia.** |
| **Mar 22:00** | Flujo web completo end-to-end | **La app iOS no se hace.** Se sustituye por la vista web en viewport móvil dentro de un marco de iPhone. El pitch no cambia una palabra. |
| Mié mañana | Video de respaldo grabado | Se graba antes que cualquier otra cosa. Es seguro barato. |

Detalle de la puerta del martes en `04-IOS-APP.md §6`.

---

## 5. Reglas que el código debe respetar

Se revisan antes de cada commit grande:

- [ ] Ningún score numérico de personas en BD, API, UI ni slides
- [ ] Ninguna credencial se emite sin `SkillClaim.confirmed = true` puesto por la ONG
- [ ] Cero PII on-chain, ni siquiera cifrada
- [ ] `.env` fuera de git (contiene `RELAYER_PRIVATE_KEY`)
- [ ] Si no está en `03-DEMO-SCRIPT.md`, no se construye

---

## 6. Pre-demo

La lista completa está en `03-DEMO-SCRIPT.md §6`. Los cuatro que más se olvidan:

- [ ] `MockChainAdapter` probado **con el RPC apagado a propósito**
- [ ] Un batch ya emitido de respaldo, con su txHash copiado a mano
- [ ] Demo ensayada 3 veces cronometrada bajo 3:00
- [ ] Hotspot del celular como red de respaldo
