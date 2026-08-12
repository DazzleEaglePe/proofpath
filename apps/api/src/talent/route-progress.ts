/**
 * Progreso de una Ruta hacia una oportunidad concreta. Ver 00-CONTEXT §2.5.
 *
 * Esta es la mecánica de juego del producto, y la única permitida: la persona
 * avanza contra los REQUISITOS PÚBLICOS de una beca o un programa, nunca contra
 * otras personas. El "2 de 4" que sale de aquí es completitud de un requisito
 * — no es un score del talento, no se persiste, no se compara entre perfiles y
 * no existe un endpoint que ordene gente por él.
 *
 * La antitrampa no es un algoritmo: un hito solo se cumple con una credencial
 * emitida y vigente, y una credencial solo existe si un emisor autorizado la
 * firmó. No se puede grindear porque no se puede auto-emitir.
 */

export type MilestoneKind =
  | 'CREDENTIAL_IN_CATEGORY' // una credencial vigente en una categoría
  | 'SKILL_CONFIRMED' // una skill confirmada por la organización
  | 'HOURS_ACCUMULATED'; // horas sumadas de experiencias ya emitidas

/** Cumplido · en revisión · pendiente. Deliberadamente no hay "fallado". */
export type MilestoneState = 'MET' | 'IN_REVIEW' | 'PENDING';

export interface RouteMilestoneSpec {
  id: string;
  order: number;
  title: string;
  kind: MilestoneKind;
  category: string | null;
  skillName: string | null;
  requiredHours: number | null;
}

/** Una credencial ya emitida. `revoked` la saca de todo cómputo. */
export interface IssuedCredentialFact {
  category: string;
  skills: string[];
  hours: number | null;
  organizationName: string;
  revoked: boolean;
}

/**
 * Una experiencia registrada que todavía no es credencial. No cumple ningún
 * hito: solo pinta el estado "en revisión", para que la ruta muestre que algo
 * está en camino en vez de parecer estancada.
 */
export interface PendingExperienceFact {
  category: string;
  skills: string[];
}

export interface TalentEvidence {
  issued: IssuedCredentialFact[];
  pending: PendingExperienceFact[];
}

export interface MilestoneProgress {
  id: string;
  order: number;
  title: string;
  state: MilestoneState;
  /** Por qué está así, en lenguaje del usuario. Nunca un número suelto. */
  detail: string;
}

export interface RouteProgress {
  metCount: number;
  totalCount: number;
  milestones: MilestoneProgress[];
  /** El primer hito pendiente: el "sigue:" del quest log. Null si está completa. */
  nextStep: string | null;
  isComplete: boolean;
}

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function sameText(left: string, right: string): boolean {
  return normalized(left) === normalized(right);
}

function evaluate(
  milestone: RouteMilestoneSpec,
  evidence: TalentEvidence,
): { state: MilestoneState; detail: string } {
  // Solo cuenta lo emitido y NO revocado. Una credencial revocada deja de
  // sostener el hito: la ruta puede retroceder, y eso es correcto.
  const vigentes = evidence.issued.filter((credential) => !credential.revoked);

  switch (milestone.kind) {
    case 'CREDENTIAL_IN_CATEGORY': {
      const match = vigentes.find(
        (credential) =>
          milestone.category !== null && sameText(credential.category, milestone.category),
      );
      if (match) {
        return { state: 'MET', detail: `${match.organizationName} · vigente` };
      }
      const enRevision = evidence.pending.some(
        (experience) =>
          milestone.category !== null && sameText(experience.category, milestone.category),
      );
      return enRevision
        ? { state: 'IN_REVIEW', detail: '1 experiencia en revisión' }
        : { state: 'PENDING', detail: 'sin evidencia todavía' };
    }

    case 'SKILL_CONFIRMED': {
      const nombre = milestone.skillName;
      if (nombre === null) return { state: 'PENDING', detail: 'sin evidencia todavía' };

      const match = vigentes.find((credential) =>
        credential.skills.some((skill) => sameText(skill, nombre)),
      );
      if (match) {
        return { state: 'MET', detail: `confirmada por ${match.organizationName}` };
      }
      const enRevision = evidence.pending.some((experience) =>
        experience.skills.some((skill) => sameText(skill, nombre)),
      );
      return enRevision
        ? { state: 'IN_REVIEW', detail: 'propuesta, falta que la confirmen' }
        : { state: 'PENDING', detail: 'sin evidencia todavía' };
    }

    case 'HOURS_ACCUMULATED': {
      const requeridas = milestone.requiredHours ?? 0;
      const acumuladas = vigentes.reduce(
        (total, credential) => total + (credential.hours ?? 0),
        0,
      );
      if (acumuladas >= requeridas) {
        return { state: 'MET', detail: `${acumuladas} horas verificadas` };
      }
      // "llevas 38 de 60" mide la ruta, no a la persona: son horas que una
      // organización firmó, no una calificación de su desempeño.
      return {
        state: 'PENDING',
        detail: `llevas ${acumuladas} de ${requeridas}`,
      };
    }
  }
}

/**
 * Calcula el avance de una ruta. Determinístico y sin efectos: se recomputa en
 * cada request y no se guarda en ningún lado.
 */
export function computeRouteProgress(
  milestones: RouteMilestoneSpec[],
  evidence: TalentEvidence,
): RouteProgress {
  const ordenados = [...milestones].sort((left, right) => left.order - right.order);

  const evaluados: MilestoneProgress[] = ordenados.map((milestone) => {
    const { state, detail } = evaluate(milestone, evidence);
    return {
      id: milestone.id,
      order: milestone.order,
      title: milestone.title,
      state,
      detail,
    };
  });

  const metCount = evaluados.filter((milestone) => milestone.state === 'MET').length;

  // El "sigue:" apunta al primer hito accionable. Lo que ya está en revisión no
  // es accionable — la pelota la tiene la organización, no el joven.
  const siguiente = evaluados.find((milestone) => milestone.state === 'PENDING');

  return {
    metCount,
    totalCount: evaluados.length,
    milestones: evaluados,
    nextStep: siguiente?.title ?? null,
    isComplete: metCount === evaluados.length && evaluados.length > 0,
  };
}
