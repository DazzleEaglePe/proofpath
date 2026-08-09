# ProofPath — API SPEC

**Framework:** NestJS · **Base URL local:** `http://localhost:3001`
**Consumidores:** `apps/web` (dashboard ONG + perfil público) y `apps/ios` (talento)

> Este documento cierra el contrato entre backend y clientes. Mientras no exista,
> frontend y móvil quedan bloqueados esperando al backend.

---

## 1. Convenciones

**Serialización: `camelCase` en todo.** Decidido aquí y no se cambia. Es lo que
producen NestJS y Prisma por defecto. Consecuencia directa para iOS: el
`JSONDecoder` de `05-IOS-ARCHITECTURE.md §4` **no debe usar
`.convertFromSnakeCase`**. Dejarlo puesto contra un backend camelCase rompe el
decoding de forma confusa, y es el bug que ese mismo documento señala como el que
más tiempo hace perder.

**`BigInt` siempre como string.** `tokenId`, `batchId` y cualquier `uint256` viajan
entre comillas. Prisma devuelve `BigInt`, que `JSON.stringify` no sabe serializar:
hace falta un interceptor global en NestJS desde el día uno. Del lado iOS, `tokenId`
es `String`, nunca `Int` — un `uint256` no entra en `Int64`.

**Fechas** en ISO 8601 UTC (`2026-08-09T14:00:00.000Z`).

**Hashes y direcciones** en hex con `0x` y **minúsculas**, siempre, para que
comparar con `===` sea seguro.

**Auth:** `Authorization: Bearer <jwt>`. Dos audiencias en el token: `talent` y
`org`. En el MVP no hay refresh ni expiración corta.

**Errores:** formato único.

```json
{ "statusCode": 400, "error": "SkillsNotConfirmed",
  "message": "La experiencia exp_123 no tiene skills confirmadas por la organizacion" }
```

`error` es un código estable que los clientes pueden comparar; `message` es texto
para humanos y puede cambiar.

---

## 2. Auth

### `POST /auth/onboarding`

Alta del talento. Crea el perfil, **genera la wallet embebida, la cifra y acuña el
TalentPass**, todo en una llamada. El usuario nunca se entera: la app solo muestra
*"Creando tu TalentPass..."*.

```json
// request
{ "fullName": "Bruno V.", "email": "bruno@example.com" }

// 201
{ "token": "eyJ...",
  "profile": { "id": "tp_abc", "fullName": "Bruno V.", "tokenId": "42",
               "walletAddress": "0xabc...", "profileCid": null } }
```

Si el mint on-chain falla, el perfil **igual se crea** con `tokenId: null` y se
reintenta después. Que la demo del onboarding dependa del RPC sería un punto de
falla evitable.

### `POST /auth/org/login`

```json
{ "email": "contacto@impulsojoven.org", "password": "..." }
→ { "token": "eyJ...", "organization": { "id": "org_1", "name": "Fundación Impulso Joven", "isTrusted": true } }
```

Sin registro de organizaciones ni flujo de aprobación: allowlist sembrada, según
`00-CONTEXT.md §5`.

---

## 3. Talento

Todas requieren token de audiencia `talent`. Son las seis de `04-IOS-APP.md §3`
más el export de llave.

### `GET /me/talentpass`

```json
{ "profileId": "tp_abc", "fullName": "Bruno V.", "tokenId": "42",
  "walletAddress": "0xabc...", "isVerified": true, "experienceCount": 3,
  "skills": [
    { "name": "Colaboración", "type": "HUMAN", "experienceCount": 3,
      "experienceTitles": ["Proyecto de Datos", "Campaña Humanitaria", "Programa de Mentoría"] }
  ] }
```

`isVerified` es cierto si el perfil tiene al menos una credencial emitida y no
revocada.

### `GET /me/experiences`

```json
[ { "id": "exp_1", "programTitle": "Plataforma de mentorías juveniles",
    "organizationName": "Fundación Impulso Joven", "role": "Full Stack Developer",
    "startDate": "2026-03-01T00:00:00.000Z", "endDate": "2026-07-01T00:00:00.000Z",
    "status": "ISSUED", "isVerified": true, "txHash": "0x..." } ]
```

### `GET /experiences/:id`

Añade `contributions`, `hoursCommitted`, `evidences[]`, `skills` separadas en
`hard` y `human`, y `credential` con `credentialHash`, `batchId` y `txHash` si ya
se emitió.

### `POST /experiences`

```json
{ "programId": "prog_1", "role": "Full Stack Developer",
  "contributions": "Dashboard, sistema de autenticación, integración API",
  "hoursCommitted": 320, "startDate": "2026-03-01", "endDate": "2026-07-01",
  "evidences": [ { "type": "REPOSITORY", "url": "https://github.com/...", "label": "Repo" } ] }
→ 201, status "DRAFT"
```

Queda esperando que la organización la analice y confirme. **No hay pantalla de
skills para el talento**: las propone la IA y las confirma la ONG.

### `GET /me/skills-summary`

Skills agrupadas con conteo de experiencias. **Solo cuenta `SkillClaim` con
`confirmed = true`.** Una skill sugerida por la IA y no confirmada no existe para
efectos de este endpoint.

**Sin campo de score, nivel ni porcentaje en ningún nivel de la respuesta.**
Ver `00-CONTEXT.md §2.1`.

### `GET /me/wallet/export`

Devuelve la llave privada descifrada, una sola vez y bajo confirmación explícita.
Es el respaldo del argumento de portabilidad: la custodia es nuestra en el MVP,
pero el joven se puede llevar su llave.

---

## 4. Organización (dashboard web)

Token de audiencia `org`.

### `GET /org/programs` · `GET /org/programs/:id`

El detalle trae las experiencias del programa con su `status`, para que la ONG vea
cuáles están listas para emitir.

### `POST /experiences/:id/ai-extract`

Manda `contributions` + evidencias al modelo y crea `SkillClaim` con
`source: AI_SUGGESTED` y `confirmed: false`. Pasa la experiencia a `AI_ANALYZED`.

```json
→ { "experienceId": "exp_1",
    "suggested": [ { "id": "sk_1", "name": "React", "type": "HARD", "confirmed": false },
                   { "id": "sk_2", "name": "Colaboración", "type": "HUMAN", "confirmed": false } ] }
```

**La IA nunca emite.** Este endpoint solo propone. Es idempotente por
`(experienceId, name)`: volver a llamarlo no duplica skills.

### `PATCH /experiences/:id/skills`

La organización confirma, descarta o agrega a mano.

```json
{ "confirm": ["sk_1", "sk_2"], "discard": ["sk_3"],
  "add": [ { "name": "Mentoría de pares", "type": "HUMAN" } ] }
```

Lo agregado a mano entra con `source: ORG_ADDED` y `confirmed: true`.

### `POST /experiences/:id/confirm`

Pasa la experiencia a `ORG_CONFIRMED`. **Rechaza con `SkillsNotConfirmed` si no hay
al menos una skill confirmada.** Esta regla vive en el service layer, no en el
controller.

### `POST /org/batches/issue`

El endpoint del momento de impacto de la demo.

```json
// request
{ "experienceIds": ["exp_1", "exp_2", "exp_3"] }

// 201
{ "batchId": "batch_1", "onChainBatchId": "1",
  "merkleRoot": "0x33dc...", "size": 3,
  "schemaId": "proofpath.experience.v1", "txHash": "0x...",
  "credentials": [ { "experienceId": "exp_1", "credentialHash": "0xc882...", "subjectTokenId": "42" } ] }
```

Secuencia interna:

1. Verifica que **todas** las experiencias estén en `ORG_CONFIRMED`. Si una no lo
   está, falla entera: nada de batches a medias.
2. Construye el VC de cada una (`02-DATA-MODEL.md §4`), canonicaliza y hashea.
3. Arma el Merkle tree y **verifica cada proof contra el root antes de mandar nada
   a la cadena**. Descubrir un proof roto acá es barato; en vivo, no.
4. `issueBatch(root, size, schemaId)` en una sola transacción.
5. Persiste `Batch` y `Credential` con su `merkleProof`, y pasa las experiencias a
   `ISSUED`.

### `POST /credentials/:credentialHash/revoke`

Marca revocada on-chain y off-chain. La fuente de verdad es la cadena.

---

## 5. Público (sin auth)

### `GET /public/talent/:tokenId`

El perfil que se proyecta en la demo. Mismo contenido que `/me/talentpass` **sin
PII**: sin email, sin teléfono, sin llave.

### `GET /public/credentials/:credentialHash/verification`

**El endpoint del que depende el clímax del pitch.** Devuelve el VC crudo para que
el navegador recompute el hash por su cuenta.

```json
{ "vc": { "@context": ["https://www.w3.org/ns/credentials/v2"], "...": "el VC completo" },
  "credentialHash": "0xc882...",
  "subjectTokenId": "42",
  "batchId": "1",
  "merkleProof": ["0x397a...", "0x0d2f..."],
  "onChain": { "merkleRoot": "0x33dc...", "issuer": "0x...", "issuedAt": "2026-08-09T14:00:00.000Z",
               "revoked": false, "txHash": "0x...", "verified": true } }
```

**Por qué devuelve el VC crudo y no solo un booleano:** el bloque 2:00–2:30 de
`03-DEMO-SCRIPT.md` consiste en editar un carácter de esta respuesta en devtools y
ver el badge pasar a rojo. Eso **solo funciona si el navegador recomputa
`credentialHash` a partir del `vc` recibido** y lo compara contra la cadena. Si la
verificación la resolviera el backend, manipular la respuesta no cambiaría nada y
el momento más importante de la demo no ocurriría.

El cliente web usa `credentialHash()` y `verifyProof()` de `@proofpath/shared` —
las mismas funciones que el backend, con el mismo test de oro detrás.

`onChain.verified` es lo que dice el backend; el badge verde lo decide el
**navegador** comparando su propio cálculo. Cuando discrepan, gana el cálculo local:
eso es exactamente lo que la demo quiere mostrar.

En iOS es distinto y está bien que lo sea: la app muestra `verified` tal como viene
(`04-IOS-APP.md §1`). No es la superficie de demo del hash roto.

---

## 6. Endpoints que NO existen

Para que nadie los espere:

- Nada del lado empresa. Talent Discovery es pantalla read-only o slide.
- Sin búsqueda, matching ni ATS.
- Sin escrow, suscripciones ni pagos.
- Sin registro de organizaciones con aprobación: allowlist sembrada.
- Sin notificaciones, emails ni multi-idioma.

→ `00-CONTEXT.md §5`
