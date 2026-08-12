# ProofPath — CONTEXT

> **Este documento se lee al inicio de toda sesión de desarrollo.** Contiene la tesis,
> los principios innegociables y las decisiones ya cerradas. Si una instrucción
> contradice este archivo, se detiene y se pregunta.

**Evento:** Hackathon Ethereum Lima 2026 — Track Arbitrum
**Ventana:** 48 horas
**Equipo:** 2 devs full stack · 1 UX de producto · 1 perfil de economía (pitch/números)

---

## 1. Tesis

ProofPath convierte experiencias reales previas al primer empleo — proyectos,
voluntariados, mentorías, hackathons e iniciativas sociales — en **evidencia
verificable de competencias**, y conecta ese talento emergente con organizaciones y
empresas que buscan capacidades demostradas.

**Hook del pitch:**

> "No todos los jóvenes sin experiencia carecen de experiencia. Muchas veces, su
> experiencia simplemente no está reconocida como experiencia profesional."

### 1.1. El motor

Destilado de Talent Protocol, Karma Proof, Galxe, Layer3, Zealy, Human Passport,
Hypercerts y Open Badges 3.0. **Las ocho comparten este patrón**, y ninguna cubre
completo el dominio de impacto social, ambiental y académico:

```text
Acción real del usuario
        ↓
Evidencia verificable emitida por un TERCERO (nunca la palabra del usuario)
        ↓
Credencial individual, NO transferible, ligada a su identidad
        ↓
Acumulación POR CATEGORÍAS (nunca un solo score)
        ↓
Desbloqueo de una oportunidad real (beca, empleo, beneficio, acceso)
```

No estamos inventando un mecanismo: estamos combinando piezas ya validadas por el
ecosistema en un dominio que ninguna cubre entera. Los cinco pasos son innegociables;
si una decisión de implementación rompe uno, se detiene y se pregunta.

### 1.2. El dato de apertura

> **En 2025, el 15.4% de jóvenes peruanos de 15 a 29 años no estudiaba ni trabajaba.**
> — Observatorio CEPLAN, `observatorio.ceplan.gob.pe/ficha/tg19`

La definición incluye a jóvenes desocupados o económicamente inactivos que no están
matriculados ni asisten a un centro educativo.

**Reglas de uso de esta cifra, y no se negocian:**

- **No mezclar** con el 18.2% / 1,589,414 de ENAHO 2022. Es de otro año y otra fuente;
  citarlas juntas es exactamente lo que un jurado pincha. Sirve como referencia
  histórica, no como cifra actual.
- **No decir que ProofPath "soluciona los NINI".** Es falso y se nota. Lo que ProofPath
  reduce es una fricción concreta: **la dificultad para demostrar experiencias y
  competencias al postular a una oportunidad**.

---

## 2. Principios innegociables

### 2.1. Ninguna cifra decide por una institución

> Revisado el 12/08/2026. La versión anterior prohibía puntos, badges y rankings
> por completo. Se revisó tras estudiar Karma Proof y Talent Protocol: el ciclo
> *acción → evidencia → reconocimiento → incentivo → nueva acción* funciona y
> mueve adopción. Lo que se prohíbe ahora es más estrecho y más preciso.

El producto tiene **dos capas**, y la confusión entre ambas es lo que corrompe a
los competidores:

```text
CAPA 1 — Motivación y experiencia
  puntos · badges · campañas · quests · rutas · rachas · rankings · perks

CAPA 2 — Confianza y oportunidades
  emisor · evidencia · firma · criterios · vigencia · revocación · privacidad
```

Karma Proof y Talent son buenos en la capa 1. ProofPath tiene que ser bueno en las
dos — y **jamás dejar que la capa 1 hable por la capa 2**.

**PERMITIDO:**

- **Puntos por dimensión** (`Impacto ambiental 180`), no transferibles y separados
  por categoría. Miden **participación validada**, no mérito ni valor moral.
- **Badges soulbound** como representación visual de una credencial.
- **Quests, rutas, campañas y rachas con período de gracia.**
- **Rankings por campaña**: acotados a un contexto, con período declarado, y
  **opt-in**. `Top contribuyentes — Reto Agua UNALM, agosto 2026`.
- **Perks y recompensas** ligadas a credenciales activas, no solo a puntos.

**PROHIBIDO:**

- **Un total dominante** que resuma a la persona en un número. Hay puntos por
  dimensión; no hay un "ProofPath Score" en la portada.
- **Ranking global permanente** de personas (`Top 100 del Perú`).
- **Que una cifra califique automáticamente** para una beca o un empleo. Los
  puntos sugieren y habilitan campañas; **los requisitos verificables deciden**, y
  quien decide es la institución.
- **Puntos por follow, retweet o conectar wallet.** Se premia evidencia validada,
  no atención.
- **Datos sensibles como mecánica de juego** (salud, donación de sangre,
  violencia). Nunca en rankings, nunca en campañas.
- **Vender o transferir** puntos, reputación o credenciales.

La diferencia se ve mejor en una frase:

```text
NO:  "Carlos tiene 900 puntos, merece la beca."
SÍ:  "Carlos cumple los tres requisitos verificables de la beca.
      Además puede participar en la campaña 'Builders por el Agua'
      por sus puntos de impacto ambiental."
```

Las ayudas humanitarias **complementan** el perfil profesional. No lo jerarquizan.
ProofPath no sentencia quién es mejor: expone la evidencia y la institución decide.

### 2.2. La evidencia no emite. Emite un emisor responsable.

La pregunta correcta no es *"¿lo revisó un humano?"* sino:

> **¿Qué organización autorizada se hace responsable de esta afirmación, y bajo qué
> política?**

El pipeline es estrictamente:

```
Evidencia presentada
(repo, entregable, certificado, correo firmado, QR de asistencia, descripción del rol)
      ↓
IA extrae y PROPONE skills candidatas
      ↓
Validación del EMISOR AUTORIZADO
(revisión humana, o regla automatizada bajo su responsabilidad)
      ↓
Firma EIP-712 del emisor
      ↓
Emisión on-chain
```

**La IA nunca es emisora. La evidencia técnica tampoco.** Un certificado, un correo con
firma DKIM o una prueba ZK demuestran el *origen e integridad de un dato* — no demuestran
que la experiencia ocurrió ni que la competencia se ejerció. Son **evidencia de entrada**
al embudo, nunca la credencial final.

En el MVP de 48h la validación es siempre humana: la organización confirma en su panel.
La regla automatizada queda especificada aquí para no cerrarnos la puerta, pero **no se
implementa** — ver §5.

Este orden es la base del argumento ético del proyecto y no se altera por conveniencia
de demo.

### 2.3. Cero PII on-chain

Ningún dato personal identificable toca la cadena. Nunca. Ni encriptado.
Ver la tabla del split en la sección 4.

### 2.4. Texto canónico

Este bloque es la formulación fijada del principio. Si el pitch, el copy de la UI o
cualquier documento contradice esto, gana esto.

```text
ProofPath convierte aprendizaje, innovación e impacto en reputación verificable
y oportunidades reales. Combina la energía de quests y recompensas con
credenciales emitidas por organizaciones confiables.

Los puntos miden participación validada. No miden mérito, valor moral ni
elegibilidad. Existen por dimensión y no existen como total dominante.

Las credenciales son afirmaciones verificables, revocables y portables sobre una
experiencia, competencia, contribución o logro. No se compran, no se venden y no
se transfieren.

La evidencia técnica —correo firmado, certificado, QR, repositorio, telemetría
o documento— nunca sustituye al emisor responsable. Puede respaldar una emisión,
pero la credencial existe únicamente cuando una organización autorizada la firma,
ya sea mediante revisión humana o una regla automatizada bajo su responsabilidad.

Las oportunidades se basan en requisitos transparentes de credenciales activas.
Ninguna cifra califica automáticamente a nadie: decide la institución.
```

**Vocabulario y mecánicas permitidas:** puntos por dimensión · badges soulbound ·
quests · rutas · campañas · rachas con período de gracia · rankings por campaña y
opt-in · perks y recompensas · credencial · perfil · categorías · evidencia ·
revocación · vigencia.

**Prohibido:** un total dominante que resuma a la persona · ranking global permanente ·
que una cifra califique automáticamente para beca o empleo · puntos por follow,
retweet o conectar wallet · datos sensibles como mecánica de juego · vender o
transferir puntos, reputación o credenciales · presentar evidencia técnica como
prueba absoluta sin declarar su fuente.

### 2.5. Reputación contextual, no plana

La reputación existe. Lo que no existe es **una sola cifra** que la resuma.

```text
Talento
  ├── Aprendizaje       cursos, certificaciones, investigación
  ├── Innovación        hackathons, repos, prototipos
  ├── Impacto social    voluntariado, mentoría, campañas
  ├── Impacto ambiental reciclaje, agua, biodiversidad
  ├── Liderazgo         equipos, comunidades, eventos
  └── Trayectoria       prácticas, empleo, emprendimiento
```

**Cada oportunidad consulta solo las dimensiones que le importan.** Una beca de IA
para agricultura mira Aprendizaje, Innovación e Impacto ambiental; un reto de
voluntariado mira Impacto social. Nunca hay un total que las compare entre sí — porque
no significa nada comparar horas de reforestación con commits.

**La regla operativa:** *el "nivel" lo define la oportunidad, no la plataforma.*
Layer3 da un mapa cuyo destino es un badge. ProofPath da un mapa cuyo destino es **una
beca real, con nombre y fecha de cierre**. Los puntos y las campañas alimentan la
motivación y la recurrencia; los requisitos verificables deciden el acceso.

**Los puntos solo cuentan evidencia validada.** Una experiencia autorreportada da cero
hasta que un emisor la firma, y una credencial revocada resta lo que había sumado. Esa
es toda la antitrampa que hace falta: no se puede farmear lo que no se puede
auto-emitir.

Corolario sobre incentivos económicos: **el voluntariado no paga en dinero.** Los perks
(cursos, mentorías, entradas, microgrants) se ligan a credenciales activas, no a una
transferencia por hora trabajada. Si una credencial tiene dinero directo atado, la
presión adversaria cae sobre el emisor —ONGs de cartón, horas infladas— y se destruye lo
único que vendemos: que la firma signifique algo.

### 2.6. La métrica que manda

Emitir no es el éxito. Que la credencial **abra una puerta** lo es.

| Métrica tentadora | Métrica real |
|---|---|
| Credenciales emitidas | Credenciales que abrieron una oportunidad concreta |
| Usuarios registrados | Organizaciones que emitieron una **segunda** vez |
| Horas de voluntariado totales | Empleadores que **verificaron** un TalentPass |

---

## 3. Por qué blockchain (la respuesta al jurado)

La pregunta que va a caer es: *"¿por qué esto no es una tabla en Postgres?"*.
La respuesta, en este orden:

1. **La evidencia no depende del sistema de nadie.** Hoy un certificado, un registro de
   voluntariado o una constancia viven en el correo, el Drive o la base de datos de cada
   organización. Si ese sistema cambia, migra o se apaga, el joven pierde la forma
   sencilla de demostrar la experiencia — y vuelve a tener "0 años de experiencia".
   On-chain, la atestación firmada sigue verificable aunque la organización, ProofPath y
   el servidor ya no existan.

   > **No afirmar** que "una ONG promedio en Perú dura 3–5 años". Se buscó respaldo y no
   > existe: el registro de ONGD de APCI publica entidades registradas, no duración
   > organizacional. Era el punto más pinchable del pitch y se eliminó a propósito.
   > El argumento de arriba es más fuerte y no depende de especular.
2. **Portabilidad.** El joven se lleva su TalentPass a cualquier plataforma. No es
   nuestra jaula.
3. **No-repudio.** La ONG no puede negar después que firmó.
4. **Revocación pública y auditable.** Si una credencial se emitió mal, la revocación es
   verificable por terceros, no un `UPDATE` silencioso.

**La diferenciación, en una línea.** No es "tenemos una blockchain":

> Galxe y Layer3 **registran actividad**; Talent Protocol **calcula reputación**;
> ProofPath permite que **una institución emita una afirmación verificable sobre una
> experiencia real**.

**El cierre:**

> No calificamos personas. Verificamos experiencias. Las oportunidades definen
> requisitos transparentes; la persona decide qué credenciales compartir.

**Por qué Arbitrum y no otra L2:** Stylus permite verificación de Merkle proofs a costo
significativamente menor que Solidity (hashing = compute-bound, que es exactamente donde
Stylus gana). Eso hace viable la emisión masiva de credenciales — 200 voluntarios en una
sola transacción. El benchmark de gas Solidity vs Stylus es el cierre técnico del pitch.

---

## 4. Split on-chain / off-chain

| On-chain (Arbitrum Sepolia) | Off-chain (PostgreSQL + IPFS) |
|---|---|
| `credentialHash` (keccak256 del VC canonicalizado) | El VC completo en JSON-LD |
| `issuer` (address) | Nombre, DNI, correo, teléfono |
| `subject` (tokenId del TalentPass) | Texto del proyecto, rol, responsabilidades |
| `schemaId`, `issuedAt` | Skills confirmadas, evidencias |
| Estado de revocación | Links a GitHub, entregables, imágenes |
| Merkle root del batch | Merkle proof de cada credencial |

**Verificar =** recomputar el hash del VC off-chain y compararlo contra la cadena. Si
alguien edita un carácter en la BD, el hash deja de cuadrar.

---

## 5. Alcance del MVP (48h)

### Dentro

- ONG emite un batch de credenciales en **una sola transacción** (Merkle root)
- El joven tiene un TalentPass (SBT) con sus credenciales verificadas
- Cualquiera puede verificar una credencial públicamente
- IA propone skills desde la evidencia; la ONG confirma antes de emitir
- Onboarding sin wallet visible (embedded wallet + gas patrocinado)
- Perfil progresivo del talento con formación, ubicación, disponibilidad e intereses;
  estos datos son opcionales y permanecen off-chain.
- Exploración móvil de oportunidades de voluntariado publicadas por organizaciones.
- Recomendaciones de oportunidades explicables según intereses, modalidad,
  disponibilidad y competencias ya verificadas. El orden interno no se presenta como
  score ni calificación de la persona.

### Fuera (explícitamente)

- **Talent Discovery para empresas.** La búsqueda comercial de candidatos se muestra
  como pantalla read-only o slide; no se construye matching de personas ni ATS.
- Postulación formal a oportunidades, seguimiento de candidaturas y mensajería. En esta
  fase, `Explorar` informa y ayuda a descubrir; el CTA de postulación queda en roadmap.
- Sponsored Talent Challenges / escrow
- Planes de suscripción, pagos, facturación
- Registro de issuers con flujo de aprobación (se reduce a una allowlist)
- Multi-idioma y notificaciones de producto. Sí se permiten emails transaccionales de
  verificación y recuperación de cuenta.

**Regla de corte de la demo:** si algo no aparece en `03-DEMO-SCRIPT.md`, no entra al
camino crítico del pitch. Las iteraciones de producto posteriores sí se construyen
cuando quedan aprobadas y documentadas en `08-MAPA-FUNCIONALIDADES.md`.

---

## 6. Stack cerrado

Sin slashes. Sin alternativas. Estas son las decisiones:

| Capa | Decisión |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind 4 + shadcn/ui + wagmi/viem |
| Backend | NestJS + Prisma |
| Base de datos | PostgreSQL |
| Contratos | Solidity (Foundry) → módulo Stylus/Rust time-boxed |
| Red | Arbitrum Sepolia |
| Wallet | Keypair generado en backend (`viem`), cifrado en Postgres + **export de llave** + relayer con gas patrocinado |
| Almacenamiento | IPFS vía Pinata |
| IA | OpenAI GPT-4o-mini para extracción de skills |
| Scaffolding | Scaffold-Stylus (base del bootcamp ETH Lima) |

**Descartados y por qué:**

- *Stylus puro:* toolchain WASM + debugging ciego con 48h y sin experiencia previa en Rust
- *Solidity solo:* cumple las reglas del track pero no responde "¿por qué no Base?"
- *EAS:* protocolo genérico multi-chain — debilita el vínculo con Arbitrum y no da batch
  issuance con Merkle root
- *Supabase, FastAPI, Arweave:* no aportan sobre las opciones elegidas; añaden superficie
- *Privy / thirdweb:* Privy web y Privy iOS son **dos SDKs distintos** → dos integraciones
  completas de auth para un flujo que no se ve en la demo. El botón de exportar llave da
  el 80% del argumento de portabilidad por ~1h de trabajo. Privy queda en el roadmap.

**Postura honesta sobre la custodia (para el Q&A):** en el MVP la custodia es nuestra,
para que el registro solo pida identidad básica y acceso — nombres, apellidos, correo y
contraseña — sin exponer conceptos de wallet. La llave es exportable, así que el joven
se la puede llevar. En producción migra a ERC-4337. Y el argumento de persistencia no
depende de la custodia: la atestación queda anclada al `tokenId` y es verificable por
cualquiera para siempre.

---

## 7. Patrones de arquitectura

- **Repository pattern** sobre Prisma. Los servicios no tocan Prisma directo.
- **Adapter para la capa chain** (`ChainAdapter` con implementaciones `ArbitrumAdapter` y
  `MockChainAdapter`). **Crítico:** permite demostrar el flujo completo aunque el RPC
  falle en vivo. Es el plan B de la demo.
- **Service layer** con las reglas de negocio. La confirmación humana antes de emitir vive
  aquí, no en el controller.
- **DTOs con class-validator** en todos los endpoints.

---

## 8. Glosario

| Término | Definición |
|---|---|
| **TalentPass** | SBT (ERC-721 no transferible) que representa la identidad del talento. Uno por persona. |
| **Credential / Atestación** | Afirmación verificable emitida por una organización sobre una experiencia concreta. |
| **Issuer** | Organización/ONG acreditada que emite credenciales. En el MVP, allowlist. |
| **Holder** | El joven. Posee el TalentPass y sus credenciales. |
| **Verifier** | Quien verifica. En el MVP, cualquiera con el link público. |
| **Batch** | Conjunto de credenciales emitidas en una sola tx vía Merkle root. |
| **Evidence-backed skill** | Skill respaldada por evidencia concreta y confirmada por el issuer. Nunca auto-declarada. |
| **Human skills** | Preferido sobre "soft skills". Competencias humanas observadas en contexto. |

Mapeo al estándar W3C Verifiable Credentials: `Issuer → ONG`, `Holder → Talento`,
`Verifier → Empresa`.
