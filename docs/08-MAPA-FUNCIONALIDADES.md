# ProofPath — MAPA DE FUNCIONALIDADES

> Qué existe hoy, qué está especificado pero sin construir, y qué está fuera de
> alcance a propósito. Inventario hecho leyendo los controllers y las pantallas
> reales, no la memoria.

**Estados:**

| Símbolo | Significa |
|---|---|
| ✅ | Construido y con pruebas |
| 🟡 | Especificado en los docs, **sin construir** |
| ⚪ | Ni especificado ni construido — hueco detectado |
| ⛔ | Fuera de alcance por decisión (`00-CONTEXT §5`) |

---

## 1. Talento (app iOS)

| Funcionalidad | Endpoint | Backend | iOS |
|---|---|---|---|
| Alta con nombre y correo | `POST /auth/onboarding` | ✅ | ✅ `OnboardingView` |
| Wallet embebida + mint del TalentPass | (dentro del alta) | ✅ | ✅ transparente |
| Ver mi TalentPass | `GET /me/talentpass` | ✅ | ✅ `TalentPassView` |
| Listar mis experiencias | `GET /me/experiences` | ✅ | ✅ `TalentPassView` |
| Detalle de experiencia | `GET /experiences/:id` | ✅ | ✅ `ExperienceDetailView` |
| Competencias con conteo | `GET /me/skills-summary` | ✅ | ✅ (viene en talentpass) |
| Registrar experiencia | `POST /experiences` | ✅ | ✅ `NewExperienceView` |
| Exportar llave privada | `POST /me/wallet/export` | ✅ | ⚪ sin pantalla |
| **Elegir a qué programa postular** | — | ⚪ | ⚪ **hoy se escribe el ID a mano** |

---

## 2. Organización (dashboard web)

| Funcionalidad | Endpoint | Backend | Web |
|---|---|---|---|
| Login | `POST /auth/org/login` | ✅ | ✅ `/org/login` |
| Datos de mi organización | `GET /org/me` | ✅ | ✅ `/org` |
| Programas con sus experiencias | `GET /org/programs` | ✅ | ✅ `/org` |
| La IA propone skills | `POST /experiences/:id/ai-extract` | ✅ | ✅ botón "Analizar con IA" |
| Confirmar / descartar / agregar skills | `PATCH /experiences/:id/skills` | ✅ | ✅ chips clicables |
| Dar experiencia por lista | `POST /experiences/:id/confirm` | ✅ | ✅ |
| **Emitir batch en una sola tx** | `POST /org/batches/issue` | ✅ | ✅ |
| **Revocar una credencial** | `POST /credentials/:hash/revoke` | 🟡 | 🟡 |
| Crear programas | — | ⚪ | ⚪ solo por seed |
| Registro de organizaciones | — | ⛔ | ⛔ allowlist sembrada |

---

## 3. Verificador (público, sin auth)

| Funcionalidad | Endpoint | Backend | Web |
|---|---|---|---|
| Perfil público del talento | `GET /public/talent/:tokenId` | ✅ | ✅ `/talento/[tokenId]` |
| **Verificar credencial** | `GET /public/credentials/:hash/verification` | ✅ | ✅ `/verificar/[hash]` |
| Recomputar el hash en el navegador | (cliente) | — | ✅ **el clímax del pitch** |
| Verificar el Merkle proof en el navegador | (cliente) | — | ✅ |
| Link a Arbiscan | — | ✅ `txHash` | ✅ |

---

## 4. Transversales

| Funcionalidad | Estado | Nota |
|---|---|---|
| JWT con audiencias `talent` / `org` | ✅ | un token de talento no puede emitir |
| Pertenencia: una ONG solo toca lo suyo | ✅ | probado con `ForbiddenException` |
| `ChainAdapter` Arbitrum / Mock | ✅ | el mock **verifica proofs de verdad** |
| `SkillExtractor` OpenAI / Mock | ✅ | sin API key se degrada solo |
| `GET /health` con el adapter activo | ✅ | mirarlo antes de salir a escena |
| Seed reiniciable | ✅ | `pnpm --filter api db:seed` |
| Contratos desplegados | 🟡 | **bloqueado por el faucet** |
| Módulo Stylus desplegado | 🟡 | compila y pasa `check`; falta deploy |
| Benchmark de gas real | 🟡 | envoltorios escritos, faltan las tx |
| IPFS / Pinata | ⚪ | los CID son nullable, no está en la demo |

---

## 5. Huecos detectados

Ordenados por lo que cuestan si no se cierran.

### 5.1. Revocación — 🟡 especificada, sin construir

Existe el contrato (`AttestationRegistry.revoke`), el adapter (`chain.revoke`) y
el repositorio (`markRevoked`). **Falta el servicio y el endpoint.**

Importa porque la revocación auditable es **uno de los cuatro argumentos de
"por qué blockchain"** de `00-CONTEXT §3`, y está en la tabla de preguntas
esperadas del jurado (`03-DEMO-SCRIPT §4`: *"¿cómo evitan que una ONG mienta?"*).
Si alguien pide verlo, hoy no hay qué mostrar.

Costo estimado: **~40 minutos**, porque todas las piezas de abajo ya están.

### 5.2. El talento no puede elegir programa — ⚪ ni especificado ni construido

`NewExperienceView` pide escribir el **ID del programa a mano**. No existe un
`GET /programs` público ni para el talento, así que en la demo hay que copiar un
cuid de la base.

Es el único punto del flujo donde la app pide algo que un usuario real no podría
saber. Si la app sale en el pitch, se nota.

Costo estimado: **~30 minutos** (endpoint + selector).

### 5.3. `isVerified` significa dos cosas distintas — ⚪ desajuste semántico

En el backend `isVerified` es **"tiene al menos una credencial emitida"**. La app
lo está usando como *"el TalentPass todavía se está registrando"*, y muestra
**"Preparando registro"** / **"En proceso"**.

Es factualmente falso: el pass ya está acuñado y tiene número. Un jurado puede
preguntar por qué dice "preparando" si arriba dice `#5`.

Copy correcto para `isVerified == false` con `tokenId != null`:
*"Sin experiencias verificadas todavía"*.

Costo: **una línea**, pero es de UX.

### 5.4. Sin pantalla de export de llave — ⚪

El endpoint existe y es el respaldo del argumento de portabilidad
(`00-CONTEXT §6`), pero no hay dónde tocarlo desde la app.

Costo estimado: **~20 minutos**. Solo hace falta si el pitch menciona la
portabilidad.

---

## 6. Fuera de alcance, a propósito

No son huecos. Están descartados en `00-CONTEXT §5` y no se construyen:

- **Todo el lado empresa.** Talent Discovery es slide o pantalla read-only.
- Búsqueda, matching, ATS.
- Sponsored Talent Challenges, escrow.
- Suscripciones, pagos, facturación.
- Registro de organizaciones con flujo de aprobación.
- Multi-idioma, notificaciones, emails.

**Regla de corte:** si no aparece en `03-DEMO-SCRIPT.md`, no se construye.

---

## 7. Qué queda para llegar a la demo

| | Depende de |
|---|---|
| Fondear el relayer y desplegar | **vos** — faucet de Arbitrum Sepolia |
| Correr el benchmark de gas | el deploy |
| Cerrar los huecos 5.1 y 5.2 | ~70 minutos de backend |
| Ensayo cronometrado bajo 3:00 | el equipo |
| Video de respaldo de 90 s | el equipo |
| Probar el mock con el RPC apagado | 10 minutos |
