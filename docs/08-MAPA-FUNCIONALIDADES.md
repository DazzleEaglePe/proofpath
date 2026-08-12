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
| Registro con nombres, apellidos, correo y contraseña | `POST /auth/talent/register` | ✅ | ✅ `OnboardingView` |
| Verificación de correo por código | `POST /auth/talent/verify-email` | ✅ | ✅ `TalentEmailVerificationView` |
| Login con contraseña | `POST /auth/talent/login` | ✅ | ✅ `TalentLoginView` |
| Recuperación de cuenta | `POST /auth/talent/forgot-password` + `/reset-password` | ✅ | ✅ `TalentLoginView` |
| Wallet embebida + mint del TalentPass | (al verificar) | ✅ | ✅ transparente |
| Ver mi TalentPass | `GET /me/talentpass` | ✅ | ✅ `TalentPassView` |
| Ver datos de Mi cuenta | `GET /me/talentpass` | ✅ | ✅ `AccountView` |
| Ver y editar perfil progresivo | `GET/PATCH /me/profile` | ✅ | ✅ `DiscoveryProfileEditView` |
| Cerrar sesión con confirmación | local, borra JWT de Keychain | — | ✅ `AccountView` |
| Navegación inferior TalentPass / Explorar / Experiencias / Cuenta | local | — | ✅ `AuthenticatedRootView` |
| Explorar oportunidades de ONG | `GET /me/opportunities/recommended` | ✅ | ✅ `ExploreView` |
| Buscar y filtrar por modalidad | local sobre oportunidades | — | ✅ `ExploreViewModel` |
| Explicar por qué se recomienda | mismo endpoint, `recommendationReasons` | ✅ | ✅ sin score ni ranking |
| Postular formalmente a una oportunidad | — | 🟡 | 🟡 siguiente fase |
| Listar mis experiencias | `GET /me/experiences` | ✅ | ✅ `ExperiencesView` + resumen en `TalentPassView` |
| Detalle de experiencia | `GET /experiences/:id` | ✅ | ✅ `ExperienceDetailView` |
| Competencias con conteo | `GET /me/skills-summary` | ✅ | ✅ (viene en talentpass) |
| Registrar experiencia | `POST /experiences` | ✅ | ✅ `NewExperienceView` |
| Exportar llave privada | `POST /me/wallet/export` | ✅ | ⚪ sin pantalla |
| **Asociar una experiencia a su programa** | `GET /programs` | ✅ | ✅ selector con organización y programa |

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
| **Revocar una credencial** | `POST /credentials/:hash/revoke` | ✅ | 🟡 falta el botón |
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
| Errores móviles sanitizados | ✅ | modal genérico; nunca expone rutas ni body HTTP |

---

## 5. Huecos detectados

Ordenados por lo que cuestan si no se cierran.

### 5.1. Revocación — ✅ backend cerrado, falta el botón

`POST /credentials/:hash/revoke` ya existe: marca la cadena primero y la base
después, es idempotente, y solo la organización emisora puede revocar.

Importa porque la revocación auditable es **uno de los cuatro argumentos de
"por qué blockchain"** de `00-CONTEXT §3`, y está en la tabla de preguntas
esperadas del jurado (`03-DEMO-SCRIPT §4`: *"¿cómo evitan que una ONG mienta?"*).

**Falta en el dashboard:** un botón "Revocar" en cada credencial emitida. Con
eso, si el jurado lo pide, se muestra en vivo cómo el badge del perfil público
pasa a rojo.

### 5.2. Selector de programa — ✅ cerrado

`GET /programs` ya devuelve los programas con el nombre de su organización.

La app consume el endpoint y presenta una hoja con programas históricos o vigentes,
organización y
descripción. `NewExperienceView` conserva internamente el `id` elegido, pero nunca lo
muestra ni permite editarlo como texto.

### 5.3. `isVerified` significa dos cosas distintas — ✅ copy corregido

En el backend `isVerified` significa **"tiene al menos una credencial emitida"**. La app
ya distingue entre `tokenId == null` (*"Preparando TalentPass"*) y un pass acuñado sin
credenciales (*"Sin experiencias verificadas todavía"*).

### 5.4. Sin pantalla de export de llave — ⚪

El endpoint existe y es el respaldo del argumento de portabilidad
(`00-CONTEXT §6`), pero no hay dónde tocarlo desde la app.

Costo estimado: **~20 minutos**. Solo hace falta si el pitch menciona la
portabilidad.

### 5.5. Postulación a oportunidades — 🟡 siguiente fase

`Explorar` ya descubre, filtra y explica oportunidades. La pantalla de detalle es
informativa y no finge una postulación. Para cerrar el flujo hace falta una entidad
`Application`, consentimiento explícito para compartir el perfil, estados de seguimiento
y un endpoint idempotente. No reutilizar `POST /experiences`: una experiencia registra
trabajo ya realizado y una postulación expresa intención futura.

---

## 6. Fuera de alcance, a propósito

No son huecos. Están descartados en `00-CONTEXT §5` y no se construyen:

- Talent Discovery para empresas sigue como slide o pantalla read-only.
- Matching de personas y ATS. El orden de oportunidades para el propio talento sí está
  implementado y no califica personas.
- Postulación formal y seguimiento de candidaturas (documentado como siguiente fase).
- Sponsored Talent Challenges, escrow.
- Suscripciones, pagos, facturación.
- Registro de organizaciones con flujo de aprobación.
- Multi-idioma y notificaciones de producto. Los únicos emails son los
  transaccionales de verificación y recuperación.

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
