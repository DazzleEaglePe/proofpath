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

### 2.2. La IA propone, el humano confirma

El pipeline es estrictamente:

```
Evidencia (repo, entregable, descripción del rol)
      ↓
IA extrae y PROPONE skills candidatas
      ↓
La ORGANIZACIÓN confirma / corrige / descarta
      ↓
Firma EIP-712 del emisor
      ↓
Emisión on-chain
```

**La IA nunca es emisora.** Si el humano no confirmó, no hay credencial. Este orden es
la base del argumento ético del proyecto y no se altera por conveniencia de demo.

### 2.3. Cero PII on-chain

Ningún dato personal identificable toca la cadena. Nunca. Ni encriptado.
Ver la tabla del split en la sección 4.

---

## 3. Por qué blockchain (la respuesta al jurado)

La pregunta que va a caer es: *"¿por qué esto no es una tabla en Postgres?"*.
La respuesta, en este orden:

1. **La evidencia sobrevive al emisor.** Una ONG promedio en Perú dura 3–5 años. Cuando
   cierra, su PDF y su base de datos desaparecen — y el joven vuelve a tener "0 años de
   experiencia". On-chain, la atestación sigue verificable aunque la ONG, ProofPath y el
   servidor ya no existan.
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

### Fuera (explícitamente)

- **Todo el lado empresa.** Talent Discovery se muestra como pantalla read-only o slide.
  No se construye búsqueda, matching ni ATS.
- Sponsored Talent Challenges / escrow
- Planes de suscripción, pagos, facturación
- Registro de issuers con flujo de aprobación (se reduce a una allowlist)
- Multi-idioma, notificaciones, emails

**Regla de corte:** si algo no aparece en `03-DEMO-SCRIPT.md`, no se construye.

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
para que el onboarding sean dos campos. La llave es exportable, así que el joven se la
puede llevar. En producción migra a ERC-4337. Y el argumento de persistencia no depende
de la custodia: la atestación queda anclada al `tokenId` y es verificable por cualquiera
para siempre.

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
