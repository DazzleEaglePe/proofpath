# ProofPath — DATA MODEL

**ORM:** Prisma · **Motor:** PostgreSQL

> Regla base: `00-CONTEXT.md §4`. Ningún PII toca la cadena. Todo lo identificable vive
> aquí; la cadena solo guarda hashes, direcciones y estado de revocación.

---

## 1. Diagrama de relaciones

```
Organization ──< Program ──< Experience >── TalentProfile
                                 │
                                 ├──< Evidence
                                 ├──< SkillClaim
                                 └──> Credential ──> Batch
```

---

## 2. Schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ACTORES ────────────────────────────────────────────────

model Organization {
  id            String   @id @default(cuid())
  name          String
  description   String?
  logoUrl       String?
  walletAddress String   @unique          // issuer en la allowlist on-chain
  isTrusted     Boolean  @default(false)  // espejo de trustedIssuers
  contactEmail  String
  createdAt     DateTime @default(now())

  programs      Program[]
  credentials   Credential[]
  batches       Batch[]

  @@index([walletAddress])
}

model TalentProfile {
  id            String   @id @default(cuid())
  fullName      String                    // PII — nunca on-chain
  email         String   @unique          // PII
  phone         String?                   // PII
  headline      String?
  walletAddress String?  @unique          // embedded wallet, se crea en onboarding
  tokenId       BigInt?  @unique          // tokenId del TalentPassSBT
  profileCid    String?                   // CID IPFS del perfil público
  createdAt     DateTime @default(now())

  experiences   Experience[]
  credentials   Credential[]

  @@index([tokenId])
}

// ─── PROGRAMAS Y EXPERIENCIAS ───────────────────────────────

model Program {
  id             String   @id @default(cuid())
  organizationId String
  title          String
  description    String
  startDate      DateTime
  endDate        DateTime?
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  experiences    Experience[]

  @@index([organizationId])
}

model Experience {
  id              String           @id @default(cuid())
  programId       String
  talentProfileId String
  role            String                     // "Frontend Developer"
  contributions   String                     // texto libre, insumo de la IA
  hoursCommitted  Int?
  startDate       DateTime
  endDate         DateTime?
  status          ExperienceStatus @default(DRAFT)
  createdAt       DateTime         @default(now())

  program         Program        @relation(fields: [programId], references: [id])
  talentProfile   TalentProfile  @relation(fields: [talentProfileId], references: [id])
  evidences       Evidence[]
  skillClaims     SkillClaim[]
  credential      Credential?

  @@index([programId])
  @@index([talentProfileId])
}

enum ExperienceStatus {
  DRAFT              // el joven la registró
  AI_ANALYZED        // la IA propuso skills
  ORG_CONFIRMED      // la ONG confirmó — listo para emitir
  ISSUED             // credencial emitida on-chain
}

model Evidence {
  id           String       @id @default(cuid())
  experienceId String
  type         EvidenceType
  url          String                       // repo, demo, entregable
  label        String
  createdAt    DateTime     @default(now())

  experience   Experience @relation(fields: [experienceId], references: [id])

  @@index([experienceId])
}

enum EvidenceType {
  REPOSITORY
  DEPLOYED_DEMO
  DOCUMENT
  IMAGE
  LINK
}

// ─── SKILLS ─────────────────────────────────────────────────

model SkillClaim {
  id           String     @id @default(cuid())
  experienceId String
  name         String                       // "React", "Coordinación de equipos"
  type         SkillType
  source       SkillSource                  // quién la propuso
  confirmed    Boolean    @default(false)   // ← la ONG confirmó
  confirmedAt  DateTime?
  createdAt    DateTime   @default(now())

  experience   Experience @relation(fields: [experienceId], references: [id])

  @@index([experienceId])
  @@unique([experienceId, name])
}

enum SkillType {
  HARD
  HUMAN            // preferido sobre "SOFT" — ver 00-CONTEXT §8
}

enum SkillSource {
  AI_SUGGESTED     // la IA la propuso
  ORG_ADDED        // la ONG la agregó manualmente
}
```

**Nota deliberada:** `SkillClaim` **no tiene campo de score, nivel ni porcentaje**. Es
intencional y no se agrega. Ver `00-CONTEXT.md §2.1`. Una skill está confirmada o no lo
está; su peso lo da la cantidad de experiencias donde aparece.

```prisma
// ─── CREDENCIALES Y BATCHES ─────────────────────────────────

model Batch {
  id             String   @id @default(cuid())
  organizationId String
  onChainBatchId BigInt?  @unique          // batchId del contrato
  merkleRoot     String                    // 0x...
  size           Int
  schemaId       String   @default("proofpath.experience.v1")
  txHash         String?
  issuedAt       DateTime?
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  credentials    Credential[]

  @@index([organizationId])
}

model Credential {
  id              String           @id @default(cuid())
  experienceId    String           @unique
  organizationId  String
  talentProfileId String
  batchId         String?

  vcJson          Json                      // el VC completo en JSON-LD
  vcCid           String?                   // CID IPFS del VC
  credentialHash  String           @unique  // keccak256(canonicalJSON(vcJson))
  merkleProof     String[]                  // array de 0x... para verificar
  subjectTokenId  BigInt                    // tokenId del TalentPass

  status          CredentialStatus @default(PENDING)
  issuedAt        DateTime?
  revokedAt       DateTime?
  createdAt       DateTime         @default(now())

  experience      Experience    @relation(fields: [experienceId], references: [id])
  organization    Organization  @relation(fields: [organizationId], references: [id])
  talentProfile   TalentProfile @relation(fields: [talentProfileId], references: [id])
  batch           Batch?        @relation(fields: [batchId], references: [id])

  @@index([credentialHash])
  @@index([talentProfileId])
}

enum CredentialStatus {
  PENDING
  ISSUED
  REVOKED
}
```

---

## 3. Qué vive dónde

| Dato | Off-chain | On-chain | Por qué |
|---|:---:|:---:|---|
| `fullName`, `email`, `phone` | ✅ | ❌ | PII |
| Descripción del proyecto y rol | ✅ | ❌ | Texto largo, caro e innecesario |
| Skills confirmadas | ✅ | ❌ | Van dentro del VC, cubiertas por el hash |
| `credentialHash` | ✅ | ✅ | Off-chain para lookup, on-chain como ancla |
| `merkleRoot` | ✅ | ✅ | El compromiso criptográfico del batch |
| `merkleProof` | ✅ | ❌ | Se envía como calldata al verificar |
| `subjectTokenId` | ✅ | ✅ | Vincula credencial ↔ TalentPass |
| Estado de revocación | ✅ | ✅ | On-chain es la fuente de verdad |
| `walletAddress` del issuer | ✅ | ✅ | Allowlist |

Cuando off-chain y on-chain discrepan, **on-chain gana**. La BD es caché.

---

## 4. Estructura del Verifiable Credential

`vcJson` sigue W3C VC 2.0 de forma pragmática:

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential", "ExperienceCredential"],
  "issuer": {
    "id": "did:pkh:eip155:421614:0xORG...",
    "name": "Organización X"
  },
  "credentialSubject": {
    "id": "did:pkh:eip155:421614:0xTALENT...",
    "tokenId": "42",
    "experience": {
      "program": "Plataforma de mentorías juveniles",
      "role": "Full Stack Developer",
      "startDate": "2026-03-01",
      "endDate": "2026-07-01",
      "hoursCommitted": 320,
      "contributions": "Dashboard, sistema de autenticación, integración API"
    },
    "evidence": [
      { "type": "REPOSITORY", "url": "https://github.com/..." },
      { "type": "DEPLOYED_DEMO", "url": "https://..." }
    ],
    "skills": {
      "hard": ["React", "TypeScript", "REST APIs"],
      "human": ["Colaboración", "Comunicación", "Autonomía"]
    }
  },
  "issuanceDate": "2026-08-09T14:00:00Z",
  "schemaId": "proofpath.experience.v1"
}
```

**Sin campo de score en ningún nivel.**

---

## 5. Canonicalización (crítico)

El hash debe ser reproducible byte a byte por cualquiera. Regla normativa:

1. Serializar el objeto con **claves ordenadas alfabéticamente en todos los niveles**
2. Sin espacios ni saltos de línea (`JSON.stringify` con replacer de orden)
3. UTF-8
4. `credentialHash = keccak256(utf8Bytes(canonicalJSON))`

```ts
function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
  const keys = Object.keys(obj as object).sort();
  return `{${keys.map(k =>
    `${JSON.stringify(k)}:${canonicalize((obj as any)[k])}`
  ).join(',')}}`;
}
```

**El bug más probable del proyecto está aquí.** Si el backend canonicaliza distinto al
verificador, todo verifica en `false` sin error visible. Escribir un test que hashee el VC
de ejemplo de §4 y fije el resultado esperado como constante, **antes** de tocar los
contratos.

---

## 6. Seed para la demo

**Tres organizaciones distintas, a propósito.** El modelo ya soporta que un
`TalentProfile` acumule experiencias de múltiples `Organization` — el seed lo hace
visible sin escribir una línea de código extra.

```
3 Organizations
  ├── EDU-US                    (empleabilidad juvenil)  → issuer principal de la demo
  ├── Ubuntu                    (apoyo social y psicológico)
  └── [tercera org / hackathon] (innovación)

3 Programs — uno por organización

1 TalentProfile "protagonista" con TalentPass acuñado y experiencias de LAS TRES
2 TalentProfiles adicionales (para que el batch tenga tamaño 3)

3 Experience  → status ORG_CONFIRMED, con evidencias y skills confirmadas
0 Credential  → se emiten EN VIVO durante la demo
```

El batch se emite en vivo. Es el momento del pitch — no puede estar pre-cargado.

**Por qué importa el multi-ONG en el pitch:** demuestra que el TalentPass es del joven,
no de la organización. Cada ONG valida su parte, y la evidencia se acumula en un solo
perfil portable. Es el flywheel hecho visible en una pantalla.

Además habilita una frase fuerte: *"una ONG de innovación y una de apoyo social validan
cosas distintas del mismo joven — y ninguna de las dos es dueña de su perfil."*
