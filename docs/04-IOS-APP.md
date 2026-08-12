# ProofPath — iOS APP (TalentPass)

**Plataforma:** SwiftUI · iOS 17+ · Xcode en Mac M5 Air 16GB
**Rol que cubre:** exclusivamente el **voluntario / talento emergente**
**Superficie de demo:** NO. La demo se hace en web. La app cierra el pitch en 20 segundos.

> **API:** por defecto consume `https://proofpath.ecabot.site/api`. Para trabajar
> contra el backend local, agregar
> `PROOFPATH_API_BASE_URL=http://localhost:3001` como variable de entorno del
> Scheme de Xcode.

> **Regla de arranque:** esta app no se toca hasta que el flujo web esté completo.
> Ver criterio de corte en §6.

---

## 1. Principio de diseño: la app no tiene wallet

El voluntario **nunca firma nada**. Quien firma y emite es la organización, desde el
dashboard web. La app iOS solo lee y crea borradores contra la API NestJS.

Consecuencias, todas a favor:

- Cero SDK Web3 en Swift. Cero RPC. Cero WalletConnect.
- La app es un cliente REST normal con `URLSession` + `Codable`.
- Línea de pitch: **"el voluntario nunca ve una wallet"** — es el argumento de adopción
  más fuerte del proyecto y la app lo demuestra visualmente.

La verificación on-chain la hace el **backend**; la app muestra el resultado
(`verified: true/false` + `txHash`). No verifica por su cuenta.

---

## 2. Alcance: núcleo de producto + acceso

La navegación autenticada usa una barra inferior nativa con cuatro destinos primarios:
**TalentPass**, **Explorar**, **Experiencias** y **Cuenta**. Cada pestaña conserva su
propio `NavigationStack`. Registrar una experiencia sigue siendo una acción `+`, no una
pestaña independiente.

### 2.1. Registro, verificación y acceso

El registro solicita **nombres, apellidos, correo y contraseña**. Después envía un código
de 6 dígitos para verificar el correo; recién al confirmarlo se completa la wallet
embebida, se acuña el TalentPass y se abre la sesión.

El acceso habitual es correo + contraseña. El código de correo se reserva para:

- verificar una cuenta nueva;
- recuperar una contraseña olvidada.

La recuperación siempre muestra una respuesta neutra para no revelar si un correo está
registrado. El usuario nunca ve ni administra la wallet durante estos flujos.

### 2.2. Mi TalentPass (pantalla principal) ⭐

Es la pantalla que se muestra al final del pitch. La que más cuidado merece.

```
┌────────────────────────────┐
│  [avatar]  Bruno V.        │
│  TalentPass #42            │
│  ● Verificado en Arbitrum  │  ← badge verde
├────────────────────────────┤
│  MIS EXPERIENCIAS          │
│  ┌──────────────────────┐  │
│  │ Plataforma de        │  │
│  │ mentorías juveniles  │  │
│  │ Full Stack Developer │  │
│  │ EDU-US · 4 meses     │  │
│  │ ✓ Verificada         │  │
│  └──────────────────────┘  │
├────────────────────────────┤
│  COMPETENCIAS              │
│  Colaboración              │
│    Demostrada en 3 exp.    │
│  Comunicación              │
│    Demostrada en 2 exp.    │
└────────────────────────────┘
```

**Prohibido:** barras de progreso, porcentajes, estrellas, niveles, cualquier cosa que
parezca un puntaje. Ver `00-CONTEXT.md §2.1`. Solo conteo de experiencias.

### 2.3. Detalle de experiencia

Programa, organización, rol, fechas, contribuciones, evidencias (links tocables),
skills confirmadas separadas en técnicas y humanas.
Abajo: badge de verificación + botón **"Ver en Arbiscan"** que abre Safari con el txHash.
Ese botón es lo que cierra el círculo visualmente.

### 2.4. Registrar experiencia

Formulario: programa, rol, contribuciones, links de evidencia. El programa se elige
desde un selector alimentado por `GET /programs`; el usuario nunca escribe ni ve un ID
interno.
Al enviar → `POST /experiences` → queda en estado `DRAFT` esperando que la ONG la analice
y confirme. Pantalla de confirmación: *"Enviada a [Organización] para validación"*.

**No hay pantalla de skills en la app.** Las propone la IA y las confirma la ONG desde
web. El voluntario las ve ya confirmadas en 2.2.

### 2.5. Explorar oportunidades (pestaña)

Catálogo de programas de voluntariado que todavía reciben participantes. Permite buscar
por actividad, causa u organización y filtrar por modalidad. El backend ordena el
catálogo usando, cuando están disponibles:

- causas y roles de interés;
- modalidad, ciudad y horas semanales;
- carrera o área de formación;
- competencias respaldadas por credenciales vigentes.

Cada tarjeta explica al menos un motivo del orden, por ejemplo *"Coincide con tu interés
en educación"*. La UI nunca muestra score, porcentaje ni ranking de la persona. Si el
perfil todavía está vacío, el catálogo sigue funcionando y sugiere completarlo desde
Cuenta.

La vista de detalle es informativa. **La postulación formal todavía no existe**: no se
crea una experiencia ni se presenta un botón que simule una solicitud enviada.

### 2.6. Mi cuenta (pestaña)

Muestra nombre, correo verificado, identificador del TalentPass y método de acceso.
También incorpora un perfil progresivo opcional para mejorar Explorar: situación
educativa, carrera, universidad/instituto, ciclo, ciudad, disponibilidad, modalidades,
causas y roles de interés. Guardar estos datos no modifica el TalentPass on-chain.

El cierre de sesión exige confirmación y solo elimina el JWT del Keychain de ese
dispositivo. **No elimina** el TalentPass, el perfil ni las experiencias. Al cambiar
`SessionState.haySesion` a `false`, `ProofPathApp` vuelve automáticamente al flujo de
registro/acceso.

---

## 3. Endpoints que consume

Contrato consumido por la app iOS:

| Método | Ruta | Uso |
|---|---|---|
| `POST` | `/auth/talent/register` | Crea el registro pendiente y envía código |
| `POST` | `/auth/talent/verify-email` | Verifica correo, activa TalentPass y abre sesión |
| `POST` | `/auth/talent/login` | Acceso con correo + contraseña |
| `POST` | `/auth/talent/forgot-password` | Solicita código de recuperación |
| `POST` | `/auth/talent/reset-password` | Define una nueva contraseña |
| `GET` | `/me/talentpass` | Perfil, tokenId, estado de verificación |
| `GET` | `/me/experiences` | Lista de experiencias con estado |
| `GET` | `/programs` | Programas abiertos para el selector |
| `GET` | `/experiences/:id` | Detalle + evidencias + skills + txHash |
| `POST` | `/experiences` | Crea borrador |
| `GET` | `/me/skills-summary` | Skills agrupadas con conteo de experiencias |
| `GET` | `/me/profile` | Perfil educativo y preferencias de descubrimiento |
| `PATCH` | `/me/profile` | Actualiza el perfil progresivo opcional |
| `GET` | `/me/opportunities/recommended` | Oportunidades abiertas ordenadas con motivos explicables |

Auth: JWT guardado en Keychain. `SessionState` es la fuente de verdad local y el cierre
manual no necesita endpoint porque el JWT es stateless. Nada de OAuth para el MVP.

### 3.1. Errores visibles

La app nunca muestra cuerpos HTTP, rutas, métodos, nombres de tablas ni mensajes crudos
del backend. `AppError` transforma cada categoría en copy de producto y `ErrorView` lo
presenta en un modal branded con una salida clara: reintentar o volver al acceso. Los
detalles técnicos permanecen únicamente en logs de desarrollo.

---

## 4. Estructura del proyecto

```
ProofPath/
├── App/
│   └── ProofPathApp.swift
├── Models/
│   └── Models.swift              // contratos REST, incluido perfil y oportunidades
├── Services/
│   ├── APIClient.swift           // URLSession + async/await
│   ├── KeychainStore.swift
│   ├── SessionState.swift        // abre/cierra la sesión observada por la raíz
│   └── MockAPIClient.swift       // ← plan B, ver §6
├── Views/
│   ├── OnboardingView.swift
│   ├── AuthenticatedRootView.swift
│   ├── ExploreView.swift
│   ├── DiscoveryProfileEditView.swift
│   ├── ExperiencesView.swift
│   ├── AccountView.swift
│   ├── TalentPassView.swift
│   ├── ExperienceDetailView.swift
│   ├── NewExperienceView.swift
│   └── ProgramSelectorView.swift
├── ViewModels/
│   ├── ExploreViewModel.swift
│   ├── AccountViewModel.swift
│   └── DiscoveryProfileEditViewModel.swift
└── Components/
    ├── VerifiedBadge.swift
    ├── ExperienceCard.swift
    └── SkillEvidenceRow.swift
```

`APIClient` detrás de un protocolo `APIClientProtocol`, con `MockAPIClient` que devuelve
datos fijos. Mismo patrón que el `MockChainAdapter` del backend y por la misma razón.

---

## 5. Reparto de horas actualizado

Disponibilidad real estimada: bloques de 2-3h en horario laboral (remoto, con
interrupciones) + noches largas. **No planificar días completos lunes a miércoles.**

### Dev 1 (Bruno) — chain, backend, iOS

| Bloque | Tarea |
|---|---|
| **Dom tarde** | Provisionar la Mac: Xcode, Node, Docker, Postgres. **Arrancar la descarga de Xcode primero.** Luego contratos Solidity + deploy Sepolia. |
| **Dom noche** | Backend: canonicalización, hash, Merkle tree, endpoint de emisión |
| **Lun día** | Endpoint de verificación + relayer |
| **Lun noche** | `MockChainAdapter` + seed + **ventana Stylus (abandono si no sale)** |
| **Mar día** | Integración con el front web. **Checkpoint: el flujo web debe estar completo.** |
| **Mar noche** | **App iOS** (solo si pasó el checkpoint) |
| **Mié mañana** | Ensayos, video de respaldo, submit **antes** de las 14:00 |

### Dev 2 — frontend web

Sin cambios respecto a `03-DEMO-SCRIPT.md §5`. La pantalla del hash roto sigue siendo
suya y sigue siendo lo último que se sacrifica.

**Submit a las 15:00 del miércoles = subir a las 14:00.** El último tramo siempre se
complica y la plataforma se satura.

---

## 6. Criterios de corte

**La app iOS arranca solo si**, el martes a las 22:00:

- [ ] Contratos desplegados y verificados en Arbiscan
- [ ] Emisión de batch funcionando end-to-end
- [ ] Verificación funcionando
- [ ] La pantalla del hash roto operativa en web
- [ ] Demo web ensayada al menos una vez completa

Si falta cualquiera, **la app no se hace** y se sustituye por la vista web en viewport
móvil dentro de un marco de iPhone. El pitch no cambia una palabra.

**Plan B dentro de la app:** si el backend no responde en la demo, `MockAPIClient` con
datos fijos. Se mantienen los flujos principales, Explorar y Mi cuenta.

---

## 7. Dónde entra en el pitch

Bloque **2:30–3:00** de `03-DEMO-SCRIPT.md`, justo antes del cierre, **20 segundos**:

> "Y así lo ve el voluntario desde su celular."
>
> *[simulador iOS proyectado — TalentPass con las credenciales verificadas]*
>
> "Sin instalar wallet. Sin comprar cripto. Sin saber qué es una blockchain.
> Solo su experiencia, verificada."

Simulador de iPhone en pantalla completa, **no** el dispositivo físico: el proyector lo
toma sin adaptadores ni mirroring, que es un punto de falla menos.

Si el bloque de gas Solidity vs Stylus también llegó, se elige uno de los dos según lo que
esté más sólido. **No entran los dos** — no hay tiempo para ambos y el cierre pierde
fuerza si se apura.
