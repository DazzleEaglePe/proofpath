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

### 1.1. El dato de apertura

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

### 2.1. No calificamos personas. Verificamos experiencias.

**PROHIBIDO** en código, UI, prompts o copy:

- Scores numéricos de personas (`Liderazgo: 87/100`)
- Rankings, leaderboards, comparación entre perfiles
- Cualquier agregado que sugiera que una persona "vale más" que otra

**CORRECTO:** conteo de evidencias contextualizado.

```
HUMAN SKILLS EVIDENCE

Colaboración
  Demostrada en 3 experiencias
    └── Proyecto de Datos
    └── Campaña Humanitaria
    └── Programa de Mentoría
```

Las ayudas humanitarias **complementan** el perfil profesional. No lo jerarquizan.
ProofPath no sentencia quién es mejor: expone la evidencia y la empresa decide.

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
ProofPath no califica, puntúa ni ordena personas.
ProofPath verifica experiencias atribuidas a emisores responsables.

Las credenciales no son premios ni unidades de reputación acumulable.
Son afirmaciones verificables, revocables y portables sobre una experiencia,
competencia, contribución o logro.

La evidencia técnica —correo firmado, certificado, QR, repositorio, telemetría
o documento— nunca sustituye al emisor responsable. Puede respaldar una emisión,
pero la credencial existe únicamente cuando una organización autorizada la firma,
ya sea mediante revisión humana o una regla automatizada bajo su responsabilidad.

Las oportunidades se basan en requisitos transparentes de credenciales activas,
no en un score global de la persona.
```

**Vocabulario prohibido** en código, UI, prompts, copy y pitch — implica acumulación o
jerarquía personal:

XP · score · puntuación · ranking · nivel · karma points · rewards bridge ·
"top contributors" · airdrops por reputación · "más impacto = mejor persona"

**Permitido, con la función correcta:** credencial (afirmación verificable de una
institución) · badge (representación visual de una credencial, no premio por acumular) ·
perfil (portafolio compartible) · categorías (para explorar, no para ordenar) ·
evidencia (privada por defecto) · revocación (¿sigue vigente?).

### 2.5. Progresión sí, niveles no

Decisión cerrada el 12/08/2026, tras evaluar explícitamente la alternativa de
gamificación con XP y niveles. **Se descartó.** No se reabre sin volver a esta sección.

La motivación del usuario es un objetivo legítimo del producto. La resolvemos con
**progresión contra requisitos explícitos**, nunca con un número que ordene personas.

| | Cómo se ve | Veredicto |
|---|---|---|
| Progresión contra un requisito público | `Beca AgTech — te faltan 2 de 4` | ✅ Es un mapa. No compara a nadie. |
| Progresión como número acumulable | `Nivel 7 · 1.240 XP · Top 3%` | ⛔ Dice "vales 1.240". Una beca no puede usarlo. |

**La regla operativa:** *el "nivel" lo define la oportunidad, no la plataforma.*
Layer3 da un mapa cuyo destino es un badge. ProofPath da un mapa cuyo destino es **una
beca real, con nombre y fecha de cierre**. Misma motivación, apuntada a algo que le
cambia la vida a la persona — e imposible de copiar para Galxe, que no tiene
instituciones emisoras del otro lado.

Corolario sobre incentivos económicos: **el voluntariado no paga.** Si una credencial
tiene dinero atado, la presión adversaria cae sobre el emisor (ONGs de cartón, horas
infladas) y se destruye lo único que vendemos: que la firma signifique algo. El talento
no paga y no cobra. Pagan universidades, ONGs, empleadores y programas de beca — los que
hoy no pueden verificar nada.

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
