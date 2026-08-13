import { keccak256, toHex } from 'viem';
import type { ExperienceCategory } from '../talent/route-progress';

/**
 * Taxonomía canónica de competencias. Ver 00-CONTEXT §2.4.
 *
 * EL PROBLEMA QUE RESUELVE: hoy cada emisor escribe la competencia a mano.
 * "React", "ReactJS", "React.js" y "React 18" son la misma cosa y hoy son
 * cuatro filas distintas. Con eso, un hito de ruta que pide React no casa, la
 * búsqueda no encuentra y el conteo de evidencias miente.
 *
 * QUÉ VALIDA ESTE MÓDULO: el vocabulario, no los hechos. Que una competencia se
 * llame siempre igual es nuestro. Que el certificado sea auténtico NO lo es —
 * eso lo firma un emisor (§2.2). Este módulo propone; el emisor confirma.
 *
 * POR QUÉ ALIAS Y NO CLUSTERING ESTADÍSTICO: un k-means sobre embeddings daría
 * grupos distintos según los datos del día y no se puede testear. Aquí el mismo
 * texto produce siempre la misma competencia, y eso se puede fijar en un test.
 */

export type SkillType = 'HARD' | 'HUMAN';

export interface CanonicalSkill {
  /** Clave estable. NUNCA cambia: de ella sale el skillId. */
  key: string;
  /** Lo que se muestra. Se puede corregir sin romper nada. */
  label: string;
  type: SkillType;
  category: ExperienceCategory;
  /** Formas en que aparece escrita en la realidad. Se comparan normalizadas. */
  aliases: string[];
}

const TAXONOMIA: CanonicalSkill[] = [
  // ─── Académico ───────────────────────────────────────────
  {
    key: 'MATEMATICAS',
    label: 'Matemáticas',
    type: 'HARD',
    category: 'APRENDIZAJE',
    aliases: [
      'matematica',
      'matematicas',
      'olimpiada de matematica',
      'concurso de matematica',
      'algebra',
      'calculo',
      'geometria',
      'razonamiento matematico',
      'mathematics',
      'math',
    ],
  },
  {
    key: 'ESTADISTICA',
    label: 'Estadística',
    type: 'HARD',
    category: 'APRENDIZAJE',
    aliases: ['estadistica', 'probabilidad', 'inferencia estadistica', 'statistics'],
  },
  {
    key: 'ANALISIS_DATOS',
    label: 'Análisis de datos',
    type: 'HARD',
    category: 'APRENDIZAJE',
    aliases: [
      'analisis de datos',
      'analitica de datos',
      'data analysis',
      'data analytics',
      'ciencia de datos',
      'data science',
      'visualizacion de datos',
    ],
  },
  {
    key: 'INVESTIGACION',
    label: 'Investigación',
    type: 'HARD',
    category: 'APRENDIZAJE',
    aliases: [
      'investigacion',
      'metodologia de la investigacion',
      'semillero de investigacion',
      'research',
      'paper',
    ],
  },

  // ─── Técnico ─────────────────────────────────────────────
  {
    key: 'REACT',
    label: 'React',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: ['react', 'reactjs', 'react.js', 'react js', 'react 18', 'next.js', 'nextjs'],
  },
  {
    key: 'TYPESCRIPT',
    label: 'TypeScript',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: ['typescript', 'ts', 'javascript', 'js', 'node', 'nodejs', 'node.js'],
  },
  {
    key: 'PYTHON',
    label: 'Python',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: ['python', 'pandas', 'numpy', 'jupyter'],
  },
  {
    key: 'DESARROLLO_WEB',
    label: 'Desarrollo web',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: [
      'desarrollo web',
      'programacion web',
      'full stack',
      'fullstack',
      'frontend',
      'backend',
      'web development',
    ],
  },
  {
    key: 'BASES_DATOS',
    label: 'Bases de datos',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: ['base de datos', 'bases de datos', 'sql', 'postgresql', 'mysql', 'database'],
  },
  {
    key: 'INTELIGENCIA_ARTIFICIAL',
    label: 'Inteligencia artificial',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: [
      'inteligencia artificial',
      'machine learning',
      'aprendizaje automatico',
      'deep learning',
      'redes neuronales',
      'ia',
    ],
  },
  {
    key: 'BLOCKCHAIN',
    label: 'Blockchain',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: ['blockchain', 'web3', 'solidity', 'smart contract', 'contratos inteligentes'],
  },
  {
    key: 'DISENO_PRODUCTO',
    label: 'Diseño de producto',
    type: 'HARD',
    category: 'INNOVACION_TECNOLOGIA',
    aliases: [
      'diseno de producto',
      'diseno ux',
      'ux',
      'ui',
      'experiencia de usuario',
      'figma',
      'product design',
    ],
  },

  // ─── Ambiental ───────────────────────────────────────────
  {
    key: 'MONITOREO_AMBIENTAL',
    label: 'Monitoreo ambiental',
    type: 'HARD',
    category: 'IMPACTO_AMBIENTAL',
    aliases: [
      'monitoreo ambiental',
      'calidad de agua',
      'calidad del aire',
      'biodiversidad',
      'muestreo ambiental',
    ],
  },
  {
    key: 'GESTION_RESIDUOS',
    label: 'Gestión de residuos',
    type: 'HARD',
    category: 'IMPACTO_AMBIENTAL',
    aliases: ['reciclaje', 'gestion de residuos', 'residuos solidos', 'compostaje'],
  },
  {
    key: 'REFORESTACION',
    label: 'Reforestación',
    type: 'HARD',
    category: 'IMPACTO_AMBIENTAL',
    aliases: ['reforestacion', 'arborizacion', 'siembra de arboles', 'vivero'],
  },

  // ─── Humanas ─────────────────────────────────────────────
  {
    key: 'COLABORACION',
    label: 'Colaboración',
    type: 'HUMAN',
    category: 'IMPACTO_SOCIAL',
    // Las conjugaciones se listan una a una porque el lexico casa frases, no
    // morfologia. Se incluyen solo las que aparecen de verdad en certificados;
    // perseguir todas las formas verbales del español no termina nunca.
    aliases: [
      'colaboracion',
      'trabajo en equipo',
      'trabajando en equipo',
      'trabajo colaborativo',
      'teamwork',
    ],
  },
  {
    key: 'COMUNICACION',
    label: 'Comunicación',
    type: 'HUMAN',
    category: 'IMPACTO_SOCIAL',
    aliases: [
      'comunicacion',
      'oratoria',
      'expresion oral',
      'comunicacion efectiva',
      'presentaciones',
    ],
  },
  {
    key: 'LIDERAZGO',
    label: 'Liderazgo',
    type: 'HUMAN',
    category: 'LIDERAZGO_COMUNIDAD',
    aliases: ['liderazgo', 'lider', 'leadership', 'direccion de equipos'],
  },
  {
    key: 'COORDINACION_EQUIPOS',
    label: 'Coordinación de equipos',
    type: 'HUMAN',
    category: 'LIDERAZGO_COMUNIDAD',
    aliases: [
      'coordinacion de equipos',
      'coordinacion',
      'coordinador',
      'gestion de equipos',
      'organizador',
    ],
  },
  {
    key: 'GESTION_PROYECTOS',
    label: 'Gestión de proyectos',
    type: 'HARD',
    category: 'LIDERAZGO_COMUNIDAD',
    aliases: ['gestion de proyectos', 'project management', 'scrum', 'metodologias agiles'],
  },
  {
    key: 'FACILITACION',
    label: 'Facilitación',
    type: 'HUMAN',
    category: 'IMPACTO_SOCIAL',
    aliases: ['facilitacion', 'facilitador', 'tallerista', 'dictado de talleres'],
  },
  {
    key: 'MENTORIA',
    label: 'Mentoría',
    type: 'HUMAN',
    category: 'IMPACTO_SOCIAL',
    aliases: ['mentoria', 'mentor', 'tutoria', 'acompanamiento'],
  },
];

/**
 * Identificador estable de una competencia: `keccak256` de la CLAVE, no de la
 * etiqueta.
 *
 * Que salga de la clave es lo que permite corregir "Matematicas" a "Matemáticas"
 * sin invalidar ni una credencial ya emitida. Si saliera de la etiqueta, un
 * arreglo de tilde rompería todo lo firmado.
 *
 * Va versionado por la misma razón que el schemaId del VC: si algún día cambia
 * la forma de derivarlo, los identificadores viejos siguen siendo legibles.
 */
export function skillId(key: string): string {
  return keccak256(toHex(`proofpath.skill.v1:${key}`));
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

/** Índice alias → competencia, construido una vez. */
const POR_ALIAS = new Map<string, CanonicalSkill>();
for (const skill of TAXONOMIA) {
  POR_ALIAS.set(normalize(skill.label), skill);
  for (const alias of skill.aliases) POR_ALIAS.set(normalize(alias), skill);
}

export const CANONICAL_SKILLS: readonly CanonicalSkill[] = TAXONOMIA;

export interface ResolvedSkill {
  skillId: string;
  key: string;
  label: string;
  type: SkillType;
  category: ExperienceCategory;
  /** El texto original que la produjo. Sin esto la propuesta no es revisable. */
  matchedFrom: string[];
}

export interface SkillResolution {
  /** Competencias canónicas, sin duplicados. */
  resolved: ResolvedSkill[];
  /**
   * Textos que no casaron con nada. NO se inventa una competencia para ellos:
   * quedan como texto libre para que el emisor decida. Una taxonomía que
   * clasifica todo a la fuerza es una taxonomía que miente.
   */
  unmatched: string[];
}

/**
 * Colapsa una lista de competencias escritas a mano en sus formas canónicas.
 *
 * `["React.js", "reactjs", "trabajo en equipo", "Quechua"]`
 *   → resolved: [React, Colaboración]   (React una sola vez, con sus dos orígenes)
 *   → unmatched: ["Quechua"]
 */
export function resolveSkills(raw: string[]): SkillResolution {
  const encontradas = new Map<string, ResolvedSkill>();
  const unmatched: string[] = [];

  for (const texto of raw) {
    const limpio = texto.trim();
    if (limpio.length === 0) continue;

    const skill = POR_ALIAS.get(normalize(limpio));
    if (!skill) {
      if (!unmatched.includes(limpio)) unmatched.push(limpio);
      continue;
    }

    const previo = encontradas.get(skill.key);
    if (previo) {
      if (!previo.matchedFrom.includes(limpio)) previo.matchedFrom.push(limpio);
      continue;
    }

    encontradas.set(skill.key, {
      skillId: skillId(skill.key),
      key: skill.key,
      label: skill.label,
      type: skill.type,
      category: skill.category,
      matchedFrom: [limpio],
    });
  }

  return { resolved: [...encontradas.values()], unmatched };
}

/**
 * Extrae competencias del texto corrido de un certificado.
 *
 * Busca cada alias como palabra completa: sin el límite, "ia" casaba dentro de
 * "familia" y "ts" dentro de "resultados", y aparecían competencias que nadie
 * mencionó. Es el tipo de falso positivo que hace que una organización deje de
 * confiar en la propuesta y termine escribiendo todo a mano.
 */
export function extractSkillsFromText(text: string): ResolvedSkill[] {
  const normalizado = normalize(text);
  const encontradas = new Map<string, ResolvedSkill>();

  for (const skill of TAXONOMIA) {
    for (const termino of [skill.label, ...skill.aliases]) {
      const alias = normalize(termino);
      if (alias.length === 0) continue;

      const patron = new RegExp(
        `(?<![\\p{L}\\p{N}])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`,
        'u',
      );
      if (!patron.test(normalizado)) continue;

      const previo = encontradas.get(skill.key);
      if (previo) {
        if (!previo.matchedFrom.includes(termino)) previo.matchedFrom.push(termino);
      } else {
        encontradas.set(skill.key, {
          skillId: skillId(skill.key),
          key: skill.key,
          label: skill.label,
          type: skill.type,
          category: skill.category,
          matchedFrom: [termino],
        });
      }
      break; // Un alias basta; los demás solo añaden ruido al origen.
    }
  }

  return [...encontradas.values()];
}
