# ProofPath — DEMO SCRIPT

> **El documento más importante del proyecto.** En hackathon se pierde más por demo rota
> que por arquitectura mala. Si algo no aparece aquí, no se construye.

**Duración objetivo:** 3 minutos. Ensayar mínimo 3 veces cronometradas.

---

## 1. Guion (3:00)

### 0:00 — 0:25 · El problema

> "¿Cómo consigues experiencia cuando todos te piden experiencia?"
>
> "Miles de jóvenes construyen capacidades reales antes de su primer empleo: desarrollan
> proyectos, lideran comunidades, resuelven problemas para organizaciones. Pero cuando
> postulan, todo eso desaparece detrás de una frase: *sin experiencia laboral*."

Sin slides de arquitectura todavía. Solo el hook.

### 0:25 — 0:45 · Qué es ProofPath

> "ProofPath convierte esas experiencias en evidencia profesional verificable."

Slide del triángulo: talento emergente ↔ organizaciones ↔ empresas.
**Una sola frase por vértice.** No leer el canvas completo.

### 0:45 — 1:30 · La ONG emite (pantalla en vivo)

1. Login como "Fundación Impulso Joven"
2. Programa cerrado con 3 voluntarios listos
3. **Mostrar las skills que propuso la IA** y decir explícitamente:
   > "La IA propone. La organización confirma. La IA nunca emite sola."
4. Click en **Emitir batch** → una sola transacción
5. Abrir Arbiscan → mostrar el evento `BatchIssued` con `size`

**La línea de cierre de este bloque:**
> "Tres credenciales, una transacción. Con 200 voluntarios sería la misma transacción."

### 1:30 — 2:00 · El TalentPass (pantalla en vivo)

1. Abrir el perfil público del joven
2. Mostrar la experiencia con su evidencia (repo, demo, entregable)
3. Mostrar las human skills **como conteo de evidencias, no como score**:
   > "No decimos que su liderazgo es 87 sobre 100. Decimos en qué experiencias lo
   > demostró y quién lo confirma. **No calificamos personas. Verificamos experiencias.**"

### 2:00 — 2:30 · El momento del hash roto ⚡

**Este es el clímax. Ensayarlo hasta que salga solo.**

1. El badge está en **verde: Verificado en Arbitrum**
2. Abrir devtools → interceptar la respuesta → editar un carácter del rol
3. Recargar la verificación → **el badge se pone rojo**
4. Decir:
   > "Cambié una letra. El hash dejó de coincidir con la cadena. Esto no lo puede hacer
   > una base de datos: aquí la evidencia sobrevive incluso a la organización que la
   > emitió. Si esta ONG cierra mañana, esta credencial sigue siendo verificable."

Esa frase es la respuesta anticipada a *"¿por qué blockchain?"*. No esperar a que la
pregunten.

### 2:30 — 3:00 · Por qué Arbitrum + números + cierre

1. **Gráfico de dos barras:** gas de verificación Solidity vs Stylus
   > "Verificar en Stylus cuesta [X] menos. Eso es lo que hace viable emitir credenciales
   > masivas. Por eso Arbitrum y no otra L2."
   *(Si el módulo Stylus no llegó: esta barra es "proyectado", se dice así, y se pasa
   rápido al bloque de números.)*
2. **Los números del economista** (30 segundos, ver §3)
3. Cierre:
   > "El joven necesita experiencia. Las organizaciones necesitan talento. Las empresas
   > necesitan descubrir capacidad. ProofPath conecta a los tres."

---

## 2. Plan B — orden de degradación

Ejecutar en este orden según lo que falle. **Decidirlo antes, no en el escenario.**

| Falla | Respuesta |
|---|---|
| RPC lento o caído | `MockChainAdapter` (ver `00-CONTEXT §7`). El flujo completo funciona; el explorer se muestra con capturas grabadas. Se avisa: *"estoy usando el adapter local, el contrato está desplegado, aquí la tx"*. |
| Sin internet en la sala | Todo local + video de respaldo de 90s grabado en la hora 40 |
| El batch falla en vivo | Tener **un batch ya emitido** en Sepolia con su txHash a mano. Se muestra ese. |
| Stylus no llegó | La barra de gas se marca como proyección y se dice honestamente. No se inventa el número. |
| Se acaba el tiempo | Los bloques sacrificables son, en orden: el gráfico de gas → el triángulo → los números. **El hash roto nunca se sacrifica.** |

**Obligatorio hora 40:** grabar el video de respaldo de 90 segundos con la demo
funcionando. Aunque todo esté bien. Es seguro barato.

---

## 3. Bloque del economista (30s)

Tres cifras, cada una con fuente citable. Que las busque y las cierre en la hora 20 para
que entren al slide:

1. **Costo de una mala contratación junior en Perú** — sueldo + tiempo de reclutamiento +
   onboarding perdido
2. **Time-to-hire de posiciones junior/trainee** y costo por semana de vacancia
3. **TAM de talento:** egresados universitarios anuales en Perú × % subempleo profesional

Línea de cierre del bloque:

> "Cada empresa paga [S/ X] por descubrir talento que hoy descarta por un filtro de años
> de experiencia."

**Regla:** ningún número sin fuente. Los jurados de LATAM castigan las cifras inventadas
más de lo que premian las grandes.

---

## 4. Preguntas esperadas del jurado

| Pregunta | Respuesta |
|---|---|
| *"¿Por qué no es una base de datos?"* | La evidencia sobrevive al emisor. Portabilidad. No-repudio. Revocación auditable. → `00-CONTEXT §3` |
| *"¿Por qué Arbitrum y no Base?"* | Stylus: verificación de Merkle proofs a costo mucho menor. El benchmark. |
| *"¿Los usuarios necesitan wallet?"* | No. Embedded wallet + gas patrocinado por relayer. El usuario nunca ve la palabra wallet. |
| *"¿Qué pasa con los datos personales?"* | Cero PII on-chain. Solo hashes, direcciones y revocación. → tabla de `00-CONTEXT §4` |
| *"¿Cómo evitan que una ONG mienta?"* | Allowlist de issuers + revocación pública + no-repudio: su firma queda. No eliminamos la confianza, la hacemos auditable. |
| *"¿No es esto Talently?"* | Talently conecta empresas con talento que **ya construyó** carrera. ProofPath hace visible al que **la está construyendo**. |
| *"¿Y el modelo de negocio?"* | Talento free. ONG freemium. **La empresa paga.** Talent Discovery por suscripción. |

---

## 5. Reparto de las 48 horas

### Dev 1 — chain + backend

| Horas | Tarea |
|---|---|
| 0–6 | Contratos Solidity + tests + deploy Sepolia + seed |
| 6–14 | NestJS: canonicalización, hash, construcción del Merkle tree, endpoint de emisión |
| 14–24 | Endpoint de verificación + relayer con gas patrocinado + `MockChainAdapter` |
| **24–34** | **Ventana Stylus** (abandono duro en h30 si no hay deploy) |
| 34–40 | Buffer, integración, bugs |
| 40–48 | Congelado. Solo video de respaldo y ensayos. |

### Dev 2 — frontend

| Horas | Tarea |
|---|---|
| 0–4 | Scaffold-Stylus + Next.js + embedded wallet |
| 4–16 | Pantalla ONG: programa → skills propuestas por IA → confirmar → emitir batch |
| 16–28 | TalentPass público con badge de verificación |
| 28–36 | **La pantalla del hash roto** (bloque 2:00–2:30) |
| 36–48 | Pulido, responsive, ensayos |

### UX de producto

No 20 horas de wireframes. Entregable real: **el guion visual de la demo** — los 5
pantallazos exactos, en orden, y que el momento del badge rojo se vea desde el fondo de la
sala. Después, si sobra tiempo, pulir.

### Economía

Horas 0–20: las tres cifras con fuente. Horas 20–48: armar los slides y **ser quien
presenta el bloque de negocio**. Que hable quien tiene los números.

---

## 6. Checklist pre-demo (hora 44)

- [ ] Contratos verificados en Arbiscan y links a mano
- [ ] Un batch ya emitido de respaldo, con txHash copiado
- [ ] Video de 90s grabado
- [ ] `MockChainAdapter` probado con el RPC apagado a propósito
- [ ] Seed reiniciable con un comando
- [ ] Demo ensayada 3 veces cronometrada bajo 3:00
- [ ] Slides sin slashes en el stack (NestJS, PostgreSQL, IPFS — una opción por línea)
- [ ] El flujo de valor del canvas corregido: **IA propone → ONG confirma → emisión**
- [ ] Ningún score numérico de personas en ninguna pantalla ni slide
- [ ] Laptop cargada, adaptador HDMI, hotspot del celular como red de respaldo
