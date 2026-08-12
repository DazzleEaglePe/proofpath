import type { ExperienceCategory } from './route-progress';

/**
 * Puntos por dimensión. Ver 00-CONTEXT §2.1 y §2.5.
 *
 * QUÉ MIDEN: participación validada. No miden mérito, valor moral ni
 * elegibilidad. Alimentan motivación, campañas y perks — nunca deciden el
 * acceso a una beca o un empleo, que lo deciden los requisitos verificables y
 * la institución.
 *
 * POR QUÉ NO HAY TOTAL: sumar horas de reforestación con commits no significa
 * nada, y el número que saliera sería justo el "vales 900" que ProofPath se
 * niega a producir. Cada oportunidad consulta las dimensiones que le importan.
 * Este módulo NO expone un total, y hay un test que falla si alguien lo agrega.
 *
 * ANTITRAMPA: solo cuenta evidencia validada. Lo autorreportado da cero hasta
 * que un emisor firma, y lo revocado deja de contar. No se puede farmear lo que
 * no se puede auto-emitir.
 */

/** Una credencial ya emitida, con lo justo para puntuar. */
export interface ScorableCredential {
  category: ExperienceCategory | null;
  hours: number | null;
  skillCount: number;
  revoked: boolean;
}

export interface DimensionPoints {
  category: ExperienceCategory;
  points: number;
  /** Cuántas credenciales vigentes lo sostienen. Sin esto el número es opaco. */
  credentialCount: number;
}

/**
 * Una credencial vale una base fija más sus horas verificadas y sus
 * competencias confirmadas.
 *
 * Los pesos son deliberadamente romos. Afinarlos sugeriría una precisión que no
 * tenemos: no sabemos si una hora de reforestación "vale" lo mismo que una de
 * mentoría, y fingir que sí es exactamente el error que comete un score.
 */
const BASE_POR_CREDENCIAL = 50;
const PUNTOS_POR_HORA = 1;
const PUNTOS_POR_SKILL = 10;

/**
 * Puntos por categoría, de mayor a menor. Solo aparecen las dimensiones con
 * evidencia: una lista con ceros invita a leerla como un boletín de notas.
 */
export function pointsByDimension(credentials: ScorableCredential[]): DimensionPoints[] {
  const acumulado = new Map<ExperienceCategory, { points: number; count: number }>();

  for (const credential of credentials) {
    // Sin categoría no se puede acumular, y revocada dejó de ser cierta.
    if (credential.revoked || credential.category === null) continue;

    const puntos =
      BASE_POR_CREDENCIAL +
      (credential.hours ?? 0) * PUNTOS_POR_HORA +
      credential.skillCount * PUNTOS_POR_SKILL;

    const previo = acumulado.get(credential.category) ?? { points: 0, count: 0 };
    acumulado.set(credential.category, {
      points: previo.points + puntos,
      count: previo.count + 1,
    });
  }

  return [...acumulado.entries()]
    .map(([category, { points, count }]) => ({
      category,
      points,
      credentialCount: count,
    }))
    .sort(
      (left, right) =>
        right.points - left.points || left.category.localeCompare(right.category),
    );
}
