import { PrismaPg } from '@prisma/adapter-pg';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hashPassword } from '../auth/password';
import type { Prisma } from '../generated/prisma/client';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Rellena la base SIN borrar nada — complemento de `seed.ts`.
 *
 * `seed.ts` arranca de cero: borra todo y siembra los tres perfiles de la demo.
 * Eso sirve para dejar el escenario limpio, pero destruye las cuentas creadas
 * desde la app, y volver a crearlas cuesta un onboarding entero con codigo por
 * correo. Este script existe para el caso contrario: tenes la UI lista, entraste
 * con tu cuenta, y la queres ver con contenido.
 *
 *   pnpm --filter api db:enrich                  todos los perfiles vacios
 *   pnpm --filter api db:enrich brunoty@gmail.com  solo ese
 *
 * Es idempotente: reconoce lo que ya creo y no lo duplica. Nunca hace un delete.
 *
 * No emite credenciales. Deja las experiencias en ORG_CONFIRMED, que es el
 * estado desde el que la ONG emite el batch — el momento de impacto del pitch
 * (03-DEMO-SCRIPT). Para verlas verificadas, emiti desde el dashboard o con:
 *
 *   curl -X POST localhost:3001/org/batches/issue \
 *     -H "Authorization: Bearer $TOKEN_ONG" -H 'Content-Type: application/json' \
 *     -d '{"experienceIds":[...]}'
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ─── Perfiles ───────────────────────────────────────────────
// Se aplican solo a los campos que esten vacios: si la persona ya cargo su
// perfil desde la app, este script no le pisa nada.
const PERFILES = [
  {
    headline: 'Desarrollador full stack en formación',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Ingeniería de Software',
    institutionName: 'Universidad Nacional de Ingeniería',
    academicCycle: 9,
    city: 'Lima',
    weeklyAvailabilityHours: 12,
    preferredModalities: ['REMOTE', 'HYBRID'] as const,
    causeInterests: ['Educación', 'Tecnología cívica'],
    roleInterests: ['Desarrollo web', 'Análisis de datos'],
  },
  {
    headline: 'Diseñadora de producto enfocada en impacto social',
    educationStatus: 'GRADUATE' as const,
    fieldOfStudy: 'Diseño Gráfico',
    institutionName: 'Universidad Peruana de Ciencias Aplicadas',
    academicCycle: null,
    city: 'Lima',
    weeklyAvailabilityHours: 10,
    preferredModalities: ['HYBRID', 'ONSITE'] as const,
    causeInterests: ['Bienestar animal', 'Educación'],
    roleInterests: ['Diseño de producto', 'Investigación'],
  },
  {
    headline: 'Analista de datos con foco en comunidad',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Estadística',
    institutionName: 'Universidad Nacional Mayor de San Marcos',
    academicCycle: 7,
    city: 'Arequipa',
    weeklyAvailabilityHours: 8,
    preferredModalities: ['REMOTE'] as const,
    causeInterests: ['Tecnología cívica', 'Comunidad'],
    roleInterests: ['Análisis de datos', 'Investigación'],
  },
];

// ─── Experiencias ───────────────────────────────────────────
// Tres por persona y en tres estados distintos, para que la lista de la app
// muestre las tres etiquetas que sabe pintar y no una sola repetida.
const EXPERIENCIAS = [
  {
    programaTitulo: 'Plataforma de mentorías juveniles',
    role: 'Full Stack Developer',
    contributions:
      'Construí el módulo de seguimiento de mentorías con React y TypeScript, y la integración con la API de agendamiento. Migré la autenticación a tokens de sesión cortos después de un incidente de accesos compartidos, y documenté el proceso para el equipo siguiente.',
    hoursCommitted: 320,
    status: 'ORG_CONFIRMED' as const,
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date('2026-07-01T00:00:00Z'),
    evidences: [
      {
        type: 'REPOSITORY' as const,
        url: 'https://github.com/impulsojoven/plataforma-mentorias',
        label: 'Repositorio del proyecto',
      },
      {
        type: 'DEPLOYED_DEMO' as const,
        url: 'https://mentorias.impulsojoven.org',
        label: 'Demo desplegada',
      },
    ],
    skills: [
      { name: 'React', type: 'HARD' as const, confirmed: true },
      { name: 'TypeScript', type: 'HARD' as const, confirmed: true },
      { name: 'REST APIs', type: 'HARD' as const, confirmed: true },
      { name: 'Autonomía', type: 'HUMAN' as const, confirmed: true },
      { name: 'Colaboración', type: 'HUMAN' as const, confirmed: true },
    ],
  },
  {
    programaTitulo: 'Datos abiertos para barrios más seguros',
    role: 'Analista de datos voluntario',
    contributions:
      'Limpié y crucé tres fuentes municipales de incidentes para armar un tablero que los dirigentes vecinales pudieran leer sin capacitación previa. Presenté los hallazgos en dos asambleas y ajusté las visualizaciones con lo que pidieron.',
    hoursCommitted: 140,
    status: 'AI_ANALYZED' as const,
    startDate: new Date('2026-04-15T00:00:00Z'),
    endDate: new Date('2026-06-30T00:00:00Z'),
    evidences: [
      {
        type: 'REPOSITORY' as const,
        url: 'https://github.com/redcivica/tablero-barrios',
        label: 'Notebooks y tablero',
      },
      {
        type: 'DOCUMENT' as const,
        url: 'https://docs.redcivica.pe/informe-barrios-2026',
        label: 'Informe presentado en asamblea',
      },
    ],
    // Sin confirmar: es exactamente lo que la IA propuso y la ONG todavia no
    // reviso. La regla es que nadie emite sobre esto hasta que un humano acepte.
    skills: [
      { name: 'Análisis de datos', type: 'HARD' as const, confirmed: false },
      { name: 'Visualización de datos', type: 'HARD' as const, confirmed: false },
      { name: 'Comunicación', type: 'HUMAN' as const, confirmed: false },
    ],
  },
  {
    programaTitulo: 'Campaña digital de adopción responsable',
    role: 'Voluntario de comunicación digital',
    contributions:
      'Rediseñé las fichas de adopción y escribí las historias de doce animales. Armé el calendario de publicaciones y medí qué formatos generaban más consultas reales, no solo likes.',
    hoursCommitted: 90,
    status: 'DRAFT' as const,
    startDate: new Date('2026-07-01T00:00:00Z'),
    endDate: null,
    evidences: [
      {
        type: 'LINK' as const,
        url: 'https://patitas.pe/adopciones',
        label: 'Fichas publicadas',
      },
    ],
    skills: [],
  },
];

/** Devuelve solo las claves que en el registro actual estan vacias. */
function soloVacios<T extends Record<string, unknown>>(
  actual: Record<string, unknown>,
  propuesto: T,
): Partial<T> {
  const salida: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(propuesto)) {
    const previo = actual[clave];
    const vacio =
      previo === null ||
      previo === undefined ||
      previo === '' ||
      (Array.isArray(previo) && previo.length === 0);
    if (vacio) salida[clave] = valor;
  }
  return salida as Partial<T>;
}

async function organizacionPorNombre(
  name: string,
  description: string,
  contactEmail: string,
) {
  const existente = await prisma.organization.findFirst({ where: { name } });
  if (existente) return existente;
  return prisma.organization.create({
    data: {
      name,
      description,
      contactEmail,
      isTrusted: true,
      walletAddress: privateKeyToAccount(generatePrivateKey()).address.toLowerCase(),
    },
  });
}

async function programaPorTitulo(
  title: string,
  data: Omit<Prisma.ProgramUncheckedCreateInput, 'title'>,
) {
  const existente = await prisma.program.findFirst({ where: { title } });

  if (existente) {
    // Retoque de categoria para bases anteriores al enum: los programas creados
    // antes quedaron con `category` en NULL, y un programa sin clasificar no
    // cumple NINGUN hito de ruta — en silencio, que es lo peligroso. Solo se
    // rellena si falta: nunca se pisa una clasificacion que alguien ya decidio.
    if (existente.category === null && data.category) {
      return prisma.program.update({
        where: { id: existente.id },
        data: { category: data.category },
      });
    }
    return existente;
  }

  return prisma.program.create({ data: { ...data, title } });
}

/**
 * La ruta de demostracion. Sin ella el TalentPass publico no tiene nada que
 * mostrar en "Rutas abiertas", que es el cierre del pitch.
 *
 * Idempotente como todo en este script: si ya existe, no la duplica ni la pisa.
 */
async function asegurarRuta() {
  const existente = await prisma.route.findFirst({
    where: { title: { startsWith: 'Programa Demostración' } },
  });
  if (existente) return existente;

  const fondo = await organizacionPorNombre(
    'Fondo Semilla Talento Joven (organización de demostración)',
    'Convocatoria ficticia usada para demostrar cómo una oportunidad publica sus requisitos. No representa a ninguna institución real.',
    'convocatorias@fondosemilla.demo',
  );

  return prisma.route.create({
    data: {
      organizationId: fondo.id,
      title: 'Programa Demostración: Beca Semilla de Innovación 2026',
      description:
        'Seis meses de mentoría y financiamiento para jóvenes que ya demostraron impacto con evidencia verificable. Convocatoria de demostración.',
      // Calculada desde hoy: escrita fija, el dia que pasa la ruta aparece
      // cerrada sin que nadie haya tocado el codigo.
      closesAt: new Date(Date.now() + 34 * 86_400_000),
      isOpen: true,
      milestones: {
        create: [
          {
            order: 1,
            title: 'Formación acreditada',
            kind: 'CREDENTIAL_IN_CATEGORY',
            category: 'APRENDIZAJE',
          },
          {
            order: 2,
            title: 'Participación comunitaria',
            kind: 'SKILL_CONFIRMED',
            skillName: 'Colaboración',
          },
          {
            order: 3,
            title: 'Proyecto aplicado verificado',
            kind: 'CREDENTIAL_IN_CATEGORY',
            category: 'INNOVACION_TECNOLOGIA',
          },
          {
            order: 4,
            title: '400 horas de trabajo verificado',
            kind: 'HOURS_ACCUMULATED',
            requiredHours: 400,
          },
        ],
      },
    },
  });
}

/**
 * Los programas abiertos son lo que alimenta la pestaña Explorar: el repositorio
 * filtra por `isAcceptingApplications` y por fecha limite futura, asi que un
 * programa cerrado o vencido no aparece aunque exista.
 */
async function asegurarProgramas() {
  const impulso = await organizacionPorNombre(
    'Fundación Impulso Joven',
    'Organización peruana que conecta a jóvenes sin experiencia laboral con proyectos reales de impacto social.',
    'contacto@impulsojoven.org',
  );
  const redCivica = await organizacionPorNombre(
    'Red Cívica Perú',
    'Tecnología y datos abiertos para fortalecer comunidades locales.',
    'equipo@redcivica.pe',
  );
  const patitas = await organizacionPorNombre(
    'Patitas al Rescate',
    'Red de voluntariado para adopción responsable y bienestar animal.',
    'voluntariado@patitas.pe',
  );

  // Las fechas limite se calculan desde hoy. Escritas fijas, el dia que pasan
  // Explorar se vacia sin que nadie haya tocado una linea de codigo.
  const enDias = (dias: number) => new Date(Date.now() + dias * 86_400_000);

  await programaPorTitulo('Plataforma de mentorías juveniles', {
    organizationId: impulso.id,
    description:
      'Programa de cuatro meses en el que voluntarios construyen una plataforma que conecta mentores con jóvenes de últimos ciclos.',
    cause: 'Educación',
    category: 'APRENDIZAJE',
    modality: 'HYBRID',
    location: 'Lima',
    weeklyHours: 12,
    requiredSkills: ['React', 'TypeScript', 'Colaboración'],
    isAcceptingApplications: false,
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date('2026-07-01T00:00:00Z'),
  });

  await programaPorTitulo('Mentorías digitales para colegios públicos', {
    organizationId: impulso.id,
    description:
      'Diseña herramientas y acompaña talleres para que más estudiantes descubran carreras digitales.',
    cause: 'Educación',
    category: 'APRENDIZAJE',
    modality: 'REMOTE',
    location: 'Remoto · Perú',
    weeklyHours: 8,
    applicationDeadline: enDias(38),
    requiredSkills: ['React', 'Comunicación'],
    startDate: enDias(54),
    endDate: enDias(128),
  });

  await programaPorTitulo('Datos abiertos para barrios más seguros', {
    organizationId: redCivica.id,
    description:
      'Convierte información pública en visualizaciones y recursos accionables para líderes vecinales.',
    cause: 'Tecnología cívica',
    category: 'INNOVACION_TECNOLOGIA',
    modality: 'HYBRID',
    location: 'Lima',
    weeklyHours: 10,
    applicationDeadline: enDias(48),
    requiredSkills: ['TypeScript', 'Análisis de datos', 'Colaboración'],
    startDate: enDias(64),
    endDate: enDias(171),
  });

  await programaPorTitulo('Campaña digital de adopción responsable', {
    organizationId: patitas.id,
    description:
      'Mejora la comunicación y la experiencia digital con la que familias conocen animales en adopción.',
    cause: 'Bienestar animal',
    category: 'IMPACTO_SOCIAL',
    modality: 'HYBRID',
    location: 'Lima',
    weeklyHours: 6,
    applicationDeadline: enDias(59),
    requiredSkills: ['Diseño de producto', 'Comunicación'],
    startDate: enDias(69),
    endDate: null,
  });

  await programaPorTitulo('Alfabetización digital para adultos mayores', {
    organizationId: impulso.id,
    description:
      'Acompaña talleres presenciales donde adultos mayores aprenden a usar banca digital y videollamadas con seguridad.',
    cause: 'Comunidad',
    category: 'LIDERAZGO_COMUNIDAD',
    modality: 'ONSITE',
    location: 'Arequipa',
    weeklyHours: 6,
    applicationDeadline: enDias(25),
    requiredSkills: ['Comunicación', 'Paciencia'],
    startDate: enDias(40),
    endDate: enDias(130),
  });
}

async function enriquecerPerfil(email: string, indice: number): Promise<string[]> {
  const perfil = await prisma.talentProfile.findFirst({
    where: { email },
    include: { experiences: { select: { id: true } } },
  });
  if (!perfil) {
    console.log(`  ${email} — no existe, lo salteo`);
    return [];
  }

  const propuesta = PERFILES[indice % PERFILES.length];
  const cambios = soloVacios(perfil as unknown as Record<string, unknown>, {
    headline: propuesta.headline,
    educationStatus: propuesta.educationStatus,
    fieldOfStudy: propuesta.fieldOfStudy,
    institutionName: propuesta.institutionName,
    academicCycle: propuesta.academicCycle,
    city: propuesta.city,
    weeklyAvailabilityHours: propuesta.weeklyAvailabilityHours,
    preferredModalities: [...propuesta.preferredModalities],
    causeInterests: propuesta.causeInterests,
    roleInterests: propuesta.roleInterests,
  });

  if (Object.keys(cambios).length > 0) {
    await prisma.talentProfile.update({ where: { id: perfil.id }, data: cambios });
  }

  if (perfil.experiences.length > 0) {
    console.log(
      `  ${perfil.fullName} — ya tenia ${perfil.experiences.length} experiencia(s), solo completo el perfil`,
    );
    return [];
  }

  const confirmadas: string[] = [];
  for (const plantilla of EXPERIENCIAS) {
    const programa = await prisma.program.findFirst({
      where: { title: plantilla.programaTitulo },
    });
    if (!programa) continue;

    const experiencia = await prisma.experience.create({
      data: {
        programId: programa.id,
        talentProfileId: perfil.id,
        role: plantilla.role,
        contributions: plantilla.contributions,
        hoursCommitted: plantilla.hoursCommitted,
        startDate: plantilla.startDate,
        endDate: plantilla.endDate,
        status: plantilla.status,
        evidences: { create: plantilla.evidences },
        skillClaims: {
          create: plantilla.skills.map((s) => ({
            name: s.name,
            type: s.type,
            source: 'AI_SUGGESTED' as const,
            confirmed: s.confirmed,
            confirmedAt: s.confirmed ? new Date() : null,
          })),
        },
      },
    });

    if (plantilla.status === 'ORG_CONFIRMED') confirmadas.push(experiencia.id);
  }

  console.log(
    `  ${perfil.fullName} — ${EXPERIENCIAS.length} experiencias, TalentPass #${perfil.tokenId ?? '—'}`,
  );
  return confirmadas;
}

/**
 * Los perfiles sembrados antes de que existiera el login quedaron sin
 * `passwordHash`, asi que no se puede entrar con ellos desde la app — y son
 * justo los que tienen experiencias listas para emitir.
 *
 * Solo toca los fixtures `@example.com`. Las cuentas reales creadas desde la
 * app no se tocan: cambiarle la contraseña a alguien sin que lo pida es otra
 * cosa, y este script no la hace.
 */
async function repararFixturesSinContrasena(): Promise<void> {
  const secreto = process.env.SEED_TALENT_PASSWORD?.trim();
  if (!secreto) return;

  const huerfanos = await prisma.talentProfile.findMany({
    where: { passwordHash: null, email: { endsWith: '@example.com' } },
    select: { id: true, email: true },
  });
  if (huerfanos.length === 0) return;

  for (const perfil of huerfanos) {
    await prisma.talentProfile.update({
      where: { id: perfil.id },
      data: { passwordHash: hashPassword(secreto), emailVerifiedAt: new Date() },
    });
  }
  console.log(
    `Contraseña de fixture asignada a ${huerfanos.length} perfil(es) @example.com (SEED_TALENT_PASSWORD).`,
  );
}

async function main(): Promise<void> {
  // `node -r dotenv/config` deja su propio `dotenv_config_path=...` en argv, asi
  // que no alcanza con descartar las banderas: se filtra por forma de correo.
  const pedido = process.argv.slice(2).filter((a) => a.includes('@'));

  await asegurarProgramas();
  await asegurarRuta();
  await repararFixturesSinContrasena();

  const objetivos =
    pedido.length > 0
      ? pedido
      : (
          await prisma.talentProfile.findMany({
            select: { email: true },
            orderBy: { createdAt: 'asc' },
          })
        ).map((p) => p.email);

  if (objetivos.length === 0) {
    console.log('No hay perfiles en la base. Corré primero `pnpm --filter api db:seed`.');
    return;
  }

  console.log('Completando perfiles:');
  const emitibles: string[] = [];
  for (const [i, email] of objetivos.entries()) {
    emitibles.push(...(await enriquecerPerfil(email, i)));
  }

  const abiertos = await prisma.program.count({
    where: {
      isAcceptingApplications: true,
      OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
    },
  });

  console.log('');
  console.log(`${abiertos} programas abiertos para la pestaña Explorar.`);
  if (emitibles.length > 0) {
    console.log('');
    console.log('Experiencias listas para emitir (ORG_CONFIRMED):');
    console.log(JSON.stringify({ experienceIds: emitibles }));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
