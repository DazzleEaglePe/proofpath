export interface SkillSummary {
  name: string;
  type: 'HARD' | 'HUMAN';
  /** Conteo de experiencias, NUNCA un puntaje. Ver 00-CONTEXT.md §2.1. */
  experienceCount: number;
  experienceTitles: string[];
}

interface ConExperiencia {
  experience: {
    program: { title: string };
    skillClaims: Array<{ name: string; type: string }>;
  };
}

/**
 * Agrupa las skills confirmadas por nombre y cuenta EN CUANTAS EXPERIENCIAS
 * aparecen.
 *
 * Este conteo es la alternativa deliberada al puntaje. "Colaboración —
 * demostrada en 3 experiencias" dice de donde sale la afirmacion y quien la
 * respalda; "Liderazgo 87/100" no dice nada y jerarquiza personas.
 *
 * Vive aqui, en un solo lugar, porque lo consumen el perfil publico y la app del
 * talento: dos implementaciones divergentes serian dos oportunidades de que a
 * una se le cuele un numero.
 */
export function summarizeSkills(credentials: ConExperiencia[]): SkillSummary[] {
  const acumulado = new Map<string, SkillSummary>();

  for (const cred of credentials) {
    for (const skill of cred.experience.skillClaims) {
      const actual = acumulado.get(skill.name);
      if (actual) {
        actual.experienceCount += 1;
        actual.experienceTitles.push(cred.experience.program.title);
      } else {
        acumulado.set(skill.name, {
          name: skill.name,
          type: skill.type as 'HARD' | 'HUMAN',
          experienceCount: 1,
          experienceTitles: [cred.experience.program.title],
        });
      }
    }
  }

  // Mas evidencias primero; a igualdad, alfabetico. Es un orden de lectura, no
  // un ranking: ordena las skills de UN perfil, nunca perfiles entre si.
  return [...acumulado.values()].sort(
    (a, b) => b.experienceCount - a.experienceCount || a.name.localeCompare(b.name),
  );
}
