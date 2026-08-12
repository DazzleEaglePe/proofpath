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

### `POST /auth/talent/register`

Crea o actualiza un registro pendiente. Guarda nombres estructurados y la contraseña
con scrypt; el código nunca se almacena en claro.

```json
{ "givenNames": "Myriam", "familyNames": "Ccahuana Flores",
  "email": "myriam@example.com", "password": "una-clave-de-12-o-mas" }
→ { "challengeId": "uuid", "expiresAt": "2026-08-10T23:10:00.000Z",
    "message": "Te enviamos un código para verificar tu correo." }
```

En desarrollo sin proveedor de correo, la respuesta agrega `developmentCode`; jamás se
expone en producción.

### `POST /auth/talent/verify-email`

```json
{ "challengeId": "uuid", "code": "123456" }
→ { "token": "eyJ...",
    "profile": { "id": "tp_abc", "fullName": "Myriam Ccahuana Flores",
                 "givenNames": "Myriam", "familyNames": "Ccahuana Flores",
                 "tokenId": "42", "walletAddress": "0xabc...", "profileCid": null } }
```

El código vence a los 10 minutos, admite como máximo 5 intentos y se consume una sola
vez. Tras verificar, el backend genera/cifra la wallet, intenta acuñar el TalentPass y
abre la sesión. Si el mint falla, el perfil permanece activo con `tokenId: null` para
reintentar después.

### `POST /auth/talent/login`

```json
{ "email": "myriam@example.com", "password": "una-clave-de-12-o-mas" }
→ { "token": "eyJ...", "profile": { "id": "tp_abc", "fullName": "Myriam Ccahuana Flores", "...": "..." } }
```

El login habitual usa contraseña. Un correo no verificado y una contraseña incorrecta
producen la misma respuesta `InvalidCredentials`.

### `POST /auth/talent/forgot-password`

```json
{ "email": "myriam@example.com" }
→ { "challengeId": "uuid", "expiresAt": "2026-08-10T23:10:00.000Z",
    "message": "Si el correo está registrado, recibirás un código para recuperar tu cuenta." }
```

La respuesta es deliberadamente indistinguible para correos existentes y desconocidos.

### `POST /auth/talent/reset-password`

```json
{ "challengeId": "uuid", "code": "123456", "newPassword": "otra-clave-segura" }
→ { "message": "Contraseña actualizada. Ya puedes iniciar sesión." }
```

`POST /auth/onboarding` se conserva temporalmente para compatibilidad con clientes
anteriores, pero no es el flujo principal de la app.

### `POST /auth/org/login`

```json
{ "email": "contacto@impulsojoven.org", "password": "..." }
→ { "token": "eyJ...", "organization": { "id": "org_1", "name": "Fundación Impulso Joven", "isTrusted": true } }
```

Sin registro de organizaciones ni flujo de aprobación: allowlist sembrada, según
`00-CONTEXT.md §5`.

---

## 3. Talento

Todas requieren token de audiencia `talent`. Son los contratos definidos en
`04-IOS-APP.md §3`, más el export de llave.

### `GET /me/talentpass`

```json
{ "profileId": "tp_abc", "fullName": "Bryan C.", "email": "bryan@example.com", "tokenId": "42",
  "walletAddress": "0xabc...", "isVerified": true, "experienceCount": 3,
  "skills": [
    { "name": "Colaboración", "type": "HUMAN", "experienceCount": 3,
      "experienceTitles": ["Proyecto de Datos", "Campaña Humanitaria", "Programa de Mentoría"] }
  ] }
```

`email` es PII y solo aparece en este endpoint autenticado; el perfil público no lo
incluye. `isVerified` es cierto si el perfil tiene al menos una credencial emitida y no
revocada.

### `GET /me/experiences`

```json
[ { "id": "exp_1", "programTitle": "Plataforma de mentorías juveniles",
    "organizationName": "Fundación Impulso Joven", "role": "Full Stack Developer",
    "startDate": "2026-03-01T00:00:00.000Z", "endDate": "2026-07-01T00:00:00.000Z",
    "status": "ISSUED", "isVerified": true, "txHash": "0x..." } ]
```

### `GET /programs`

Devuelve los programas que el talento puede asociar al registrar una experiencia ya
realizada. Puede incluir programas históricos o cerrados: este endpoint no representa
una postulación. La app muestra `title` y `organizationName`; solo envía el `id` elegido.

```json
[ { "id": "prog_1", "title": "Plataforma de mentorías juveniles",
    "description": "Construcción de herramientas para conectar mentores y estudiantes",
    "organizationName": "Fundación Impulso Joven", "organizationIsTrusted": true,
    "cause": "Educación", "modality": "HYBRID", "location": "Lima",
    "weeklyHours": 6, "applicationDeadline": null,
    "requiredSkills": ["React", "Mentoría"],
    "startDate": "2026-03-01T00:00:00.000Z", "endDate": null } ]
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

### `GET /me/profile`

Devuelve los datos privados y opcionales que personalizan la pestaña Explorar.

```json
{
  "fullName": "Luis Sialer Ramos", "email": "luis@example.com",
  "headline": "Estudiante de software con experiencia en proyectos sociales",
  "educationStatus": "STUDENT", "fieldOfStudy": "Ingeniería de Software",
  "institutionName": "Universidad Nacional Mayor de San Marcos",
  "academicCycle": 8, "city": "Lima", "weeklyAvailabilityHours": 8,
  "preferredModalities": ["REMOTE", "HYBRID"],
  "causeInterests": ["Educación", "Tecnología cívica"],
  "roleInterests": ["Mentoría", "Desarrollo de software"]
}
```

### `PATCH /me/profile`

Actualiza parcial o totalmente el perfil progresivo. Las cadenas vacías se guardan como
`null` y las listas se limpian de elementos vacíos. `academicCycle` admite 1–20 y
`weeklyAvailabilityHours`, 1–60.

```json
{
  "educationStatus": "STUDENT", "fieldOfStudy": "Ingeniería de Software",
  "institutionName": "UNMSM", "academicCycle": 8, "city": "Lima",
  "weeklyAvailabilityHours": 8, "preferredModalities": ["REMOTE"],
  "causeInterests": ["Educación"], "roleInterests": ["Mentoría"]
}
→ 200, perfil privado actualizado
```

### `GET /me/opportunities/recommended`

Devuelve solo programas abiertos (`isAcceptingApplications = true` y deadline vigente)
ordenados por coincidencias de contenido con el perfil y las competencias confirmadas.
El algoritmo es determinista y no usa atributos sensibles. El score interno **no se
serializa**; el contrato expone motivos comprensibles.

```json
[
  {
    "id": "prog_mentor", "title": "Mentorías digitales para colegios públicos",
    "description": "Acompaña a estudiantes en sus primeros proyectos digitales.",
    "organizationName": "Red Cívica Perú", "organizationIsTrusted": true,
    "cause": "Educación", "modality": "HYBRID", "location": "Lima",
    "weeklyHours": 6, "applicationDeadline": "2026-09-30T00:00:00.000Z",
    "requiredSkills": ["Mentoría", "Comunicación"],
    "startDate": "2026-10-10T00:00:00.000Z", "endDate": null,
    "recommendationReasons": [
      "Conecta con tu interés en Educación",
      "Coincide con tu modalidad preferida"
    ]
  }
]
```

Si el perfil aún no tiene preferencias, devuelve el catálogo abierto en un orden estable
con razones generales; no bloquea Explorar.

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

- Nada de Talent Discovery para empresas: sigue como pantalla read-only o slide.
- Sin matching de personas ni ATS. La recomendación móvil solo ordena oportunidades
  abiertas para el propio talento y explica sus coincidencias.
- Sin postulación formal, estados de candidatura ni mensajería entre ONG y talento.
- Sin escrow, suscripciones ni pagos.
- Sin registro de organizaciones con aprobación: allowlist sembrada.
- Sin notificaciones de producto ni multi-idioma. Solo existen correos transaccionales
  de verificación y recuperación de cuenta.

→ `00-CONTEXT.md §5`
