import { PrismaPg } from '@prisma/adapter-pg';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hashPassword } from '../auth/password';
import { ArbitrumAdapter } from '../chain/arbitrum.adapter';
import type { ChainAdapter } from '../chain/chain-adapter';
import { MockChainAdapter } from '../chain/mock-chain.adapter';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Seed de la demo — 02-DATA-MODEL.md §6.
 *
 *   1 Organization  → "Fundación Impulso Joven", isTrusted: true
 *   1 Program       → "Plataforma de mentorías juveniles"
 *   3 TalentProfile → con TalentPass acuñado
 *   3 Experience    → ORG_CONFIRMED, con evidencias y skills confirmadas
 *   0 Credential    → se emiten EN VIVO durante la demo
 *
 * Las credenciales NO se siembran a proposito: el batch se emite en vivo y es el
 * momento de impacto del pitch. Pre-cargarlo lo vaciaria de sentido.
 *
 * Es reiniciable: borra todo antes de sembrar.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function chainAdapter(): ChainAdapter {
  return (process.env.CHAIN_ADAPTER ?? 'MOCK').toUpperCase() === 'ARBITRUM'
    ? new ArbitrumAdapter()
    : new MockChainAdapter();
}

const DEMO_EMAIL = 'contacto@impulsojoven.org';
const DEMO_PASSWORD = 'impulsojoven2026';
const TALENT_DEMO_PASSWORD = 'talentpass2026';

const TALENTOS = [
  {
    givenNames: 'Bruno',
    familyNames: 'Valdez',
    fullName: 'Bruno Valdez',
    email: 'bruno@example.com',
    headline: 'Desarrollador full stack en formación',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Ingeniería de Software',
    institutionName: 'Universidad Tecnológica del Perú',
    academicCycle: 8,
    city: 'Lima',
    weeklyAvailabilityHours: 12,
    preferredModalities: ['REMOTE', 'HYBRID'] as const,
    causeInterests: ['Educación', 'Tecnología cívica'],
    roleInterests: ['Desarrollo web', 'Análisis de datos'],
    role: 'Full Stack Developer',
    contributions:
      'Construí el dashboard de seguimiento, el sistema de autenticación y la integración con la API de mentorías. Coordiné con dos voluntarias de diseño para cerrar el flujo de registro.',
    hoursCommitted: 320,
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
      { name: 'React', type: 'HARD' as const },
      { name: 'TypeScript', type: 'HARD' as const },
      { name: 'REST APIs', type: 'HARD' as const },
      { name: 'Colaboración', type: 'HUMAN' as const },
      { name: 'Autonomía', type: 'HUMAN' as const },
    ],
  },
  {
    givenNames: 'Camila',
    familyNames: 'Ríos',
    fullName: 'Camila Ríos',
    email: 'camila@example.com',
    headline: 'Diseñadora de producto voluntaria',
    educationStatus: 'GRADUATE' as const,
    fieldOfStudy: 'Diseño',
    institutionName: 'Pontificia Universidad Católica del Perú',
    academicCycle: null,
    city: 'Lima',
    weeklyAvailabilityHours: 8,
    preferredModalities: ['REMOTE', 'HYBRID'] as const,
    causeInterests: ['Educación', 'Bienestar animal'],
    roleInterests: ['Diseño de producto', 'Investigación'],
    role: 'Product Designer',
    contributions:
      'Diseñé el flujo completo de registro y el sistema de componentes. Corrí seis entrevistas con jóvenes usuarios y ajusté el flujo dos veces según lo que encontré.',
    hoursCommitted: 240,
    evidences: [
      {
        type: 'LINK' as const,
        url: 'https://figma.com/file/ejemplo-impulso-joven',
        label: 'Sistema de diseño',
      },
      {
        type: 'DOCUMENT' as const,
        url: 'https://docs.impulsojoven.org/investigacion-usuarios',
        label: 'Informe de entrevistas',
      },
    ],
    skills: [
      { name: 'Diseño de producto', type: 'HARD' as const },
      { name: 'Investigación con usuarios', type: 'HARD' as const },
      { name: 'Comunicación', type: 'HUMAN' as const },
      { name: 'Colaboración', type: 'HUMAN' as const },
    ],
  },
  {
    givenNames: 'Diego',
    familyNames: 'Quispe',
    fullName: 'Diego Quispe',
    email: 'diego@example.com',
    headline: 'Coordinador de voluntariado',
    educationStatus: 'PROFESSIONAL' as const,
    fieldOfStudy: 'Administración',
    institutionName: 'Universidad Nacional Mayor de San Marcos',
    academicCycle: null,
    city: 'Lima',
    weeklyAvailabilityHours: 10,
    preferredModalities: ['HYBRID', 'ONSITE'] as const,
    causeInterests: ['Educación', 'Comunidad'],
    roleInterests: ['Coordinación', 'Gestión de proyectos'],
    role: 'Coordinador de Voluntariado',
    contributions:
      'Coordiné a doce voluntarios durante cuatro meses, armé el calendario de mentorías y resolví los conflictos de agenda semana a semana. Dejé documentado el proceso para la siguiente cohorte.',
    hoursCommitted: 180,
    evidences: [
      {
        type: 'DOCUMENT' as const,
        url: 'https://docs.impulsojoven.org/manual-coordinacion',
        label: 'Manual de coordinación',
      },
    ],
    skills: [
      { name: 'Gestión de proyectos', type: 'HARD' as const },
      { name: 'Coordinación de equipos', type: 'HUMAN' as const },
      { name: 'Comunicación', type: 'HUMAN' as const },
      { name: 'Resolución de conflictos', type: 'HUMAN' as const },
    ],
  },
  {
    givenNames: 'Myriam',
    familyNames: 'Ccahuana Flores',
    fullName: 'Myriam Ccahuana Flores',
    email: 'myriam@example.com',
    headline: 'Bióloga en formación, monitoreo ambiental',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Biología',
    institutionName: 'Universidad Nacional de San Antonio Abad del Cusco',
    academicCycle: 9,
    city: 'Cusco',
    weeklyAvailabilityHours: 14,
    preferredModalities: ['ONSITE', 'HYBRID'] as const,
    causeInterests: ['Medio ambiente', 'Comunidad'],
    roleInterests: ['Monitoreo ambiental', 'Análisis de datos'],
    programTitle: 'Datos abiertos para barrios más seguros',
    role: 'Analista de Monitoreo Ambiental',
    contributions:
      'Levanté y sistematicé datos de calidad de agua en tres microcuencas durante cinco meses. Armé el tablero que hoy usan las juntas vecinales para decidir dónde intervenir primero.',
    hoursCommitted: 260,
    evidences: [
      {
        type: 'DOCUMENT' as const,
        url: 'https://docs.redcivica.pe/monitoreo-microcuencas',
        label: 'Informe de monitoreo',
      },
      {
        type: 'LINK' as const,
        url: 'https://redcivica.pe/tablero-agua',
        label: 'Tablero público',
      },
    ],
    skills: [
      { name: 'Análisis de datos', type: 'HARD' as const },
      { name: 'Monitoreo ambiental', type: 'HARD' as const },
      { name: 'Colaboración', type: 'HUMAN' as const },
      { name: 'Rigor metodológico', type: 'HUMAN' as const },
    ],
  },
  {
    givenNames: 'Luis',
    familyNames: 'Sialer Ramos',
    fullName: 'Luis Sialer Ramos',
    email: 'luis@example.com',
    headline: 'Organizador comunitario y facilitador de talleres',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Trabajo Social',
    institutionName: 'Universidad Nacional de Trujillo',
    academicCycle: 6,
    city: 'Trujillo',
    weeklyAvailabilityHours: 16,
    preferredModalities: ['ONSITE'] as const,
    causeInterests: ['Comunidad', 'Educación'],
    roleInterests: ['Facilitación', 'Coordinación'],
    role: 'Facilitador de Talleres',
    contributions:
      'Facilité veinte talleres de alfabetización digital para adultos mayores en dos distritos. Formé a cuatro voluntarios nuevos para que pudieran dictar los talleres sin mí.',
    hoursCommitted: 210,
    evidences: [
      {
        type: 'DOCUMENT' as const,
        url: 'https://docs.impulsojoven.org/acta-talleres-trujillo',
        label: 'Acta de talleres',
      },
    ],
    skills: [
      { name: 'Facilitación', type: 'HARD' as const },
      { name: 'Colaboración', type: 'HUMAN' as const },
      { name: 'Comunicación', type: 'HUMAN' as const },
      { name: 'Empatía', type: 'HUMAN' as const },
    ],
  },
  {
    givenNames: 'Bryan',
    familyNames: 'Chávez Núñez',
    fullName: 'Bryan Chávez Núñez',
    email: 'bryan@example.com',
    headline: 'Desarrollador, participante de hackathons',
    educationStatus: 'STUDENT' as const,
    fieldOfStudy: 'Ciencia de la Computación',
    institutionName: 'Universidad Nacional de Ingeniería',
    academicCycle: 7,
    city: 'Lima',
    weeklyAvailabilityHours: 20,
    preferredModalities: ['REMOTE', 'HYBRID'] as const,
    causeInterests: ['Tecnología cívica', 'Educación'],
    roleInterests: ['Desarrollo web', 'Blockchain'],
    programTitle: 'Datos abiertos para barrios más seguros',
    role: 'Backend Developer',
    contributions:
      'Construí la API que agrega denuncias vecinales y el pipeline que las cruza con datos abiertos de la municipalidad. El prototipo salió de un hackathon y terminó desplegado en producción.',
    hoursCommitted: 340,
    evidences: [
      {
        type: 'REPOSITORY' as const,
        url: 'https://github.com/redcivica/api-denuncias',
        label: 'Repositorio del backend',
      },
      {
        type: 'DEPLOYED_DEMO' as const,
        url: 'https://barrios.redcivica.pe',
        label: 'Demo desplegada',
      },
    ],
    skills: [
      { name: 'TypeScript', type: 'HARD' as const },
      { name: 'Diseño de APIs', type: 'HARD' as const },
      { name: 'Análisis de datos', type: 'HARD' as const },
      { name: 'Colaboración', type: 'HUMAN' as const },
    ],
  },
];

async function main(): Promise<void> {
  const chain = chainAdapter();
  console.log(`Sembrando con ChainAdapter=${chain.name}`);

  // Reiniciable: el orden respeta las llaves foraneas.
  await prisma.credential.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.skillClaim.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.experience.deleteMany();
  // Los hitos caen solos por el ON DELETE CASCADE de la ruta.
  await prisma.route.deleteMany();
  await prisma.program.deleteMany();
  await prisma.talentProfile.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: 'Fundación Impulso Joven',
      description:
        'Organización peruana que conecta a jóvenes sin experiencia laboral con proyectos reales de impacto social.',
      walletAddress: chain.relayerAddress().toLowerCase(),
      isTrusted: true,
      contactEmail: 'contacto@impulsojoven.org',
      // Credenciales de demo. Es una organizacion sembrada, no hay registro
      // publico de ONGs en el MVP (00-CONTEXT §5).
      passwordHash: hashPassword(DEMO_PASSWORD),
    },
  });

  const program = await prisma.program.create({
    data: {
      organizationId: organization.id,
      title: 'Plataforma de mentorías juveniles',
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
    },
  });

  const civicWallet = privateKeyToAccount(generatePrivateKey()).address;
  const animalWallet = privateKeyToAccount(generatePrivateKey()).address;
  const redCivica = await prisma.organization.create({
    data: {
      name: 'Red Cívica Perú',
      description: 'Tecnología y datos abiertos para fortalecer comunidades locales.',
      walletAddress: civicWallet.toLowerCase(),
      isTrusted: true,
      contactEmail: 'equipo@redcivica.pe',
    },
  });
  const patitas = await prisma.organization.create({
    data: {
      name: 'Patitas al Rescate',
      description: 'Red de voluntariado para adopción responsable y bienestar animal.',
      walletAddress: animalWallet.toLowerCase(),
      isTrusted: true,
      contactEmail: 'voluntariado@patitas.pe',
    },
  });

  await prisma.program.createMany({
    data: [
      {
        organizationId: organization.id,
        title: 'Mentorías digitales para colegios públicos',
        description:
          'Diseña herramientas y acompaña talleres para que más estudiantes descubran carreras digitales.',
        cause: 'Educación',
        category: 'APRENDIZAJE',
        modality: 'REMOTE',
        location: 'Remoto · Perú',
        weeklyHours: 8,
        applicationDeadline: new Date('2026-09-20T23:59:59Z'),
        requiredSkills: ['React', 'Comunicación'],
        startDate: new Date('2026-10-05T00:00:00Z'),
        endDate: new Date('2026-12-18T00:00:00Z'),
      },
      {
        organizationId: redCivica.id,
        title: 'Datos abiertos para barrios más seguros',
        description:
          'Convierte información pública en visualizaciones y recursos accionables para líderes vecinales.',
        cause: 'Tecnología cívica',
        category: 'INNOVACION_TECNOLOGIA',
        modality: 'HYBRID',
        location: 'Lima',
        weeklyHours: 10,
        applicationDeadline: new Date('2026-09-30T23:59:59Z'),
        requiredSkills: ['TypeScript', 'Análisis de datos', 'Colaboración'],
        startDate: new Date('2026-10-15T00:00:00Z'),
        endDate: new Date('2027-01-30T00:00:00Z'),
      },
      {
        organizationId: patitas.id,
        title: 'Campaña digital de adopción responsable',
        description:
          'Mejora la comunicación y la experiencia digital con la que familias conocen animales en adopción.',
        cause: 'Bienestar animal',
        category: 'IMPACTO_SOCIAL',
        modality: 'HYBRID',
        location: 'Lima',
        weeklyHours: 6,
        applicationDeadline: new Date('2026-10-10T23:59:59Z'),
        requiredSkills: ['Diseño de producto', 'Comunicación'],
        startDate: new Date('2026-10-20T00:00:00Z'),
        endDate: null,
      },
    ],
  });

  // ─── Ruta demo ────────────────────────────────────────────
  //
  // El cierre del pitch: la persona no ve un puntaje, ve QUE LE FALTA para una
  // convocatoria concreta, con los requisitos publicados de antemano por quien
  // convoca. Ver 00-CONTEXT §2.5.
  //
  // Los hitos estan calibrados contra las experiencias sembradas: los talentos
  // del seed llegan con la credencial de Educacion y sus horas, y les falta la
  // parte de tecnologia civica. La ruta se ve a medio camino, que es lo que hay
  // que mostrar — una ruta vacia o una completa no explican la mecanica.
  // La estructura de hitos espeja la LOGICA de evidencia de una convocatoria real
  // (Beca 18 de PRONABEC: formacion acreditada, elegibilidad, documentacion), pero
  // NO su nombre, su logo ni sus datos. Sus requisitos de pobreza, notas e ingreso a
  // universidad necesitan integraciones oficiales y son datos sensibles: espejar la
  // forma es honesto, copiar los criterios seria mentir sobre lo que podemos probar.
  const fondoSemilla = await prisma.organization.create({
    data: {
      name: 'Fondo Semilla Talento Joven (organización de demostración)',
      description:
        'Convocatoria ficticia usada para demostrar cómo una oportunidad publica sus requisitos. No representa a ninguna institución real.',
      walletAddress: privateKeyToAccount(generatePrivateKey()).address.toLowerCase(),
      isTrusted: true,
      contactEmail: 'convocatorias@fondosemilla.demo',
    },
  });

  await prisma.route.create({
    data: {
      organizationId: fondoSemilla.id,
      title: 'Programa Demostración: Beca Semilla de Innovación 2026',
      description:
        'Seis meses de mentoría y financiamiento para jóvenes que ya demostraron impacto con evidencia verificable. Convocatoria de demostración.',
      closesAt: new Date('2026-09-15T23:59:59Z'),
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
          // La elegibilidad la revisa el programa en privado y nunca toca la cadena
          // (§2.3). Aqui se modela como horas verificadas: es lo unico de esa cuarta
          // condicion que ProofPath puede demostrar honestamente hoy.
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

  // Los programas se resuelven por titulo para que cada perfil caiga en la
  // categoria que le corresponde. Si los seis compartieran programa, las seis
  // rutas se verian identicas y la pantalla no demostraria nada.
  const programasPorTitulo = new Map(
    (await prisma.program.findMany({ select: { id: true, title: true } })).map(
      (programa) => [programa.title, programa.id] as const,
    ),
  );

  for (const t of TALENTOS) {
    // Wallet embebida: el talento nunca la ve ni firma con ella.
    // Los perfiles del seed son fixtures, asi que no se guarda la llave cifrada;
    // el onboarding real es el que la persiste.
    const account = privateKeyToAccount(generatePrivateKey());
    const { tokenId } = await chain.mintTalentPass(account.address, '');

    const profile = await prisma.talentProfile.create({
      data: {
        givenNames: t.givenNames,
        familyNames: t.familyNames,
        fullName: t.fullName,
        email: t.email,
        passwordHash: hashPassword(TALENT_DEMO_PASSWORD),
        emailVerifiedAt: new Date(),
        headline: t.headline,
        educationStatus: t.educationStatus,
        fieldOfStudy: t.fieldOfStudy,
        institutionName: t.institutionName,
        academicCycle: t.academicCycle,
        city: t.city,
        weeklyAvailabilityHours: t.weeklyAvailabilityHours,
        preferredModalities: [...t.preferredModalities],
        causeInterests: t.causeInterests,
        roleInterests: t.roleInterests,
        walletAddress: account.address.toLowerCase(),
        tokenId,
      },
    });

    // Sin `programTitle` cae al programa principal, que es el que se emite
    // en vivo durante la demo.
    const tituloPrograma = 'programTitle' in t ? t.programTitle : undefined;
    const programId =
      (tituloPrograma ? programasPorTitulo.get(tituloPrograma) : undefined) ?? program.id;

    await prisma.experience.create({
      data: {
        programId,
        talentProfileId: profile.id,
        role: t.role,
        contributions: t.contributions,
        hoursCommitted: t.hoursCommitted,
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-07-01T00:00:00Z'),
        status: 'ORG_CONFIRMED',
        evidences: { create: t.evidences },
        skillClaims: {
          create: t.skills.map((s) => ({
            name: s.name,
            type: s.type,
            // Sembradas como ya confirmadas por la ONG: la demo arranca con el
            // programa cerrado y listo para emitir.
            source: 'AI_SUGGESTED',
            confirmed: true,
            confirmedAt: new Date(),
          })),
        },
      },
    });

    console.log(`  ${t.fullName} — TalentPass #${tokenId}`);
  }

  const experiencias = await prisma.experience.findMany({
    select: { id: true },
  });
  console.log('');
  console.log(
    `Listo: 3 organizaciones, 4 programas, ${TALENTOS.length} talentos, ${experiencias.length} experiencias en ORG_CONFIRMED.`,
  );
  console.log('0 credenciales: el batch se emite en vivo durante la demo.');
  console.log('');
  console.log(`Login de la ONG:  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}`);
  // Se listan todos: con seis perfiles, recordar cual era el correcto en medio
  // de la demo es justo el tipo de friccion que no hace falta.
  console.log(`Login de talentos (contraseña ${TALENT_DEMO_PASSWORD}):`);
  for (const t of TALENTOS) {
    console.log(`  ${t.email.padEnd(22)} ${t.fullName}`);
  }
  console.log('');
  console.log('IDs para emitir:');
  console.log(JSON.stringify({ experienceIds: experiencias.map((e) => e.id) }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
