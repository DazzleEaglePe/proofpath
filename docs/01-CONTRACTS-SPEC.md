# ProofPath — CONTRACTS SPEC

**Red:** Arbitrum Sepolia
**Herramienta:** Foundry
**Solidity:** ^0.8.24
**Estrategia:** Solidity primero (ruta comprometida) → módulo Stylus time-boxed (ver §4)

> **Regla dura:** si a la hora 30 el módulo Stylus no está desplegado, se abandona sin
> discusión. El benchmark de gas pasa a slide de "next steps".

---

## 1. Contratos

Dos contratos. El `IssuerRegistry` original se disuelve en un mapping dentro de
`AttestationRegistry` para reducir superficie de despliegue y testing.

```
┌─────────────────────┐         ┌──────────────────────────┐
│   TalentPassSBT     │◄────────│   AttestationRegistry    │
│  ERC-721 no transf. │ ownerOf │  Merkle batch + revoke   │
│      (Solidity)     │         │  (Solidity → Stylus §4)  │
└─────────────────────┘         └──────────────────────────┘
```

---

## 2. TalentPassSBT

**Lenguaje:** Solidity. OpenZeppelin `ERC721` + bloqueo de transferencia.
No se porta a Stylus: es storage puro, Stylus no aporta nada aquí.

### Storage

```solidity
mapping(address => uint256) public tokenIdOf;   // wallet => tokenId (0 = no tiene)
mapping(uint256 => string)  private _tokenURIs; // tokenId => IPFS CID del perfil
uint256 private _nextTokenId;                    // arranca en 1
address public minter;                           // el relayer del backend
```

### Funciones

| Firma | Acceso | Descripción |
|---|---|---|
| `mint(address to, string calldata cid) → uint256` | `onlyMinter` | Acuña el TalentPass. Revierte si `to` ya tiene uno. |
| `setTokenURI(uint256 tokenId, string calldata cid)` | `onlyMinter` | Actualiza el CID del perfil cuando se agregan credenciales. |
| `tokenIdOf(address)` | público | Lookup directo. |
| `_update(...)` | override | **Revierte si `from != address(0)`** → no transferible. |

### Eventos

```solidity
event TalentPassMinted(address indexed holder, uint256 indexed tokenId, string cid);
event TalentPassUpdated(uint256 indexed tokenId, string cid);
```

### Errores

```solidity
error AlreadyHasPass(address holder);
error SoulboundTransferBlocked();
error NotMinter();
```

### Notas

- `_update` es el hook de OZ v5 (no `_beforeTokenTransfer`, que es v4). Confirmar versión
  instalada antes de escribir.
- Permitir burn (`to == address(0)`) es opcional. Para el MVP: **no**, mantenerlo simple.

---

## 3. AttestationRegistry

**Lenguaje:** Solidity primero. Candidato a portar `verifyProof` a Stylus (§4).

El corazón del sistema. Una ONG cierra un programa con N voluntarios y emite las N
credenciales en **una sola transacción** publicando el Merkle root. Cada joven prueba
individualmente su credencial con un Merkle proof.

### Storage

```solidity
struct Batch {
    address issuer;
    bytes32 merkleRoot;
    uint64  issuedAt;
    uint32  size;        // cantidad de credenciales en el batch
    string  schemaId;    // ej. "proofpath.experience.v1"
}

mapping(uint256 => Batch)  public batches;        // batchId => Batch
mapping(bytes32 => bool)   public revoked;        // credentialHash => revocado
mapping(address => bool)   public trustedIssuers; // allowlist (sustituye IssuerRegistry)
uint256 public nextBatchId;                        // arranca en 1
address public owner;
```

### Construcción de la hoja del Merkle

**Debe ser idéntica en backend y contrato.** Esta definición es normativa:

```
leaf = keccak256(keccak256(abi.encodePacked(credentialHash, subjectTokenId)))
```

**Por qué el doble hash.** `abi.encodePacked(bytes32, uint256)` produce exactamente 64
bytes — el mismo tamaño que el preimage de un nodo interno del árbol. Con un solo hash,
un nodo interno puede hacerse pasar por hoja (segunda preimagen). Hashear dos veces separa
los dominios: es lo que hace `StandardMerkleTree` de OpenZeppelin y no cuesta nada. La
decisión es irreversible después del deploy.

`subjectTokenId` se codifica como **uint256 de 32 bytes**, nunca como string. Si el backend
concatena `"42"` en texto, el leaf no cuadra y todo verifica en `false` en silencio.

Donde `credentialHash = keccak256(bytes(canonicalJSON(VC)))`.
La canonicalización del VC está definida en `02-DATA-MODEL.md §5`. Cualquier divergencia
rompe la verificación de forma silenciosa — es el bug más probable del proyecto.
Está fijada por el test de oro en `packages/shared/src/canonicalize.test.ts`:
`credentialHash` del VC de ejemplo = `0xc8827c3b4d969a2d0409b5d2b7a0bed193a08339b46867f37025b020cd74e764`.

Usar `MerkleProof.verify` de OpenZeppelin, con **ordenamiento de pares por valor**
(`a < b ? hash(a,b) : hash(b,a)`) para que el proof no cargue flags de posición.
El backend debe usar la misma convención (`merkletreejs` con `sortPairs: true`).

### Funciones

| Firma | Acceso | Descripción |
|---|---|---|
| `issueBatch(bytes32 root, uint32 size, string calldata schemaId) → uint256` | `onlyTrustedIssuer` | Registra el batch. Emite `BatchIssued`. |
| `verifyProof(uint256 batchId, bytes32 credentialHash, uint256 subjectTokenId, bytes32[] calldata proof) → bool` | `view` | Verifica pertenencia al batch **y** que no esté revocada. |
| `revoke(bytes32 credentialHash)` | `onlyTrustedIssuer` | Marca como revocada. Emite `CredentialRevoked`. |
| `setTrustedIssuer(address issuer, bool trusted)` | `onlyOwner` | Allowlist. |

`verifyProof` devuelve `false` (no revierte) si el proof no cuadra o si está revocada —
el front necesita distinguir estados, no capturar excepciones.

### Eventos

```solidity
event BatchIssued(
    uint256 indexed batchId,
    address indexed issuer,
    bytes32 merkleRoot,
    uint32  size,
    string  schemaId
);
event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);
event TrustedIssuerSet(address indexed issuer, bool trusted);
```

`BatchIssued` es el evento que se muestra en el explorer durante la demo. Que se vea
`size: 200` en una sola tx es el momento de impacto.

### Errores

```solidity
error NotTrustedIssuer(address caller);
error NotOwner();
error EmptyBatch();
error BatchNotFound(uint256 batchId);
```

---

## 4. Módulo Stylus (time-boxed, horas 24–34)

**Alcance:** portar **solo** `verifyProof` a Rust/Stylus. Nada más.

Es la pieza más pequeña y autocontenida del sistema: sin estándares que respetar, sin
storage complejo, y es hashing puro — exactamente donde Stylus le gana a Solidity.

### Plan

1. `cargo stylus new proofpath-verifier`
2. Implementar `verify_proof(root: B256, leaf: B256, proof: Vec<B256>) -> bool` con la
   **misma convención de ordenamiento por valor**
3. `cargo stylus check` → `cargo stylus deploy` en Arbitrum Sepolia
4. **Benchmark:** ejecutar la misma verificación (proof de profundidad 8) contra el
   contrato Solidity y contra el Stylus. Registrar gas de ambos.
5. El resultado va a un gráfico de dos barras en el pitch

### Consideraciones

- Stylus requiere un paso de **activación** del contrato tras el deploy. No es opcional y
  cuesta gas. Presupuestarlo.
- Los contratos Stylus son interoperables con EVM: `AttestationRegistry` en Solidity puede
  llamar al verificador Stylus vía interfaz. **No hacer esto en el MVP** — mantenerlos
  independientes y comparar off-chain. Integrarlos añade riesgo sin ganar puntos.
- Si el benchmark sale peor de lo esperado, **reportarlo honestamente**. Un jurado técnico
  respeta más un número real con explicación que un número inflado.

### Criterio de abandono

Hora 30 sin deploy exitoso → se archiva la rama, se sigue con Solidity, el benchmark se
convierte en slide de roadmap. No se negocia en el momento.

---

## 5. Despliegue y orden de trabajo

```
1. TalentPassSBT        (~40 líneas propias sobre OZ)   → h0-2
2. AttestationRegistry  (~120 líneas)                    → h2-5
3. Tests Foundry: happy path + proof inválido + revocada → h5-6
4. Deploy Sepolia + verificación en Arbiscan             → h6
5. Seed: allowlist del issuer de demo + mint de 3 passes → h6
```

**Variables de entorno del backend:**

```
ARBITRUM_SEPOLIA_RPC=
TALENTPASS_ADDRESS=
ATTESTATION_REGISTRY_ADDRESS=
RELAYER_PRIVATE_KEY=      # wallet con ETH de faucet, es el minter y el issuer
```

El relayer es una wallet única del backend que paga todo el gas. En producción esto sería
un paymaster ERC-4337; para el MVP, un relayer simple es suficiente y honesto de explicar.

---

## 6. Tests mínimos (Foundry)

No más de estos seis. Cubren lo que puede romper la demo:

1. `test_MintTalentPass_Success`
2. `test_MintTalentPass_RevertsIfAlreadyHasPass`
3. `test_Transfer_Reverts` ← el que prueba que es soulbound
4. `test_IssueBatch_EmitsEvent`
5. `test_VerifyProof_ValidProofReturnsTrue`
6. `test_VerifyProof_RevokedReturnsFalse`
