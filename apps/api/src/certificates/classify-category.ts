import type { ExperienceCategory } from '../talent/route-progress';

/**
 * Clasificación de un certificado en la taxonomía cerrada. Ver 00-CONTEXT §2.4.
 *
 * QUÉ MIDE EL PUNTAJE: la confianza del clasificador sobre UN DOCUMENTO. No es
 * un puntaje de la persona, no se acumula, no se guarda y no sale al TalentPass.
 * Un certificado no "vale 87 puntos": el 0.87 dice cuánta seguridad tiene el
 * modelo de que ese texto pertenece a esa categoría. Es descartable en cuanto
 * el emisor confirma la categoría — que es siempre quien decide.
 *
 * Léxico y no LLM, por tres razones concretas: corre sin API key (el backend ya
 * se degrada a MOCK sin OpenAI), es determinístico —el mismo texto da siempre
 * el mismo resultado, y eso se puede testear—, y devuelve QUÉ términos lo
 * llevaron ahí, que es lo que hace revisable la propuesta.
 */

export interface CategoryGuess {
  category: ExperienceCategory;
  /** 0..1. Confianza sobre el documento, jamás sobre la persona. */
  confidence: number;
  /** Los términos que dispararon la propuesta. Sin esto no es revisable. */
  matchedTerms: string[];
}

/**
 * Peso 2 para términos que casi determinan la categoría por sí solos; peso 1
 * para los que solo la sugieren. "Reforestación" sola basta; "proyecto" no.
 */
const LEXICO: Record<ExperienceCategory, [string, number][]> = {
  APRENDIZAJE: [
    ['curso', 2],
    ['certificacion', 2],
    ['diplomado', 2],
    ['capacitacion', 2],
    ['taller', 1],
    ['aprobado', 1],
    ['calificacion', 1],
    ['modulo', 1],
    ['syllabus', 1],
    ['horas academicas', 2],
    ['course', 2],
    ['training', 2],
    ['completed', 1],
  ],
  IMPACTO_AMBIENTAL: [
    ['reforestacion', 2],
    ['reciclaje', 2],
    ['ambiental', 2],
    ['residuos', 2],
    ['arborizacion', 2],
    ['limpieza de playa', 2],
    ['limpieza de rio', 2],
    ['huella de carbono', 2],
    ['biodiversidad', 2],
    ['conservacion', 2],
    ['agua', 1],
    ['sostenibilidad', 1],
    ['clima', 1],
  ],
  IMPACTO_SOCIAL: [
    ['voluntariado', 2],
    ['voluntario', 2],
    ['donacion', 2],
    ['comedor', 2],
    ['albergue', 2],
    ['mentoria', 2],
    ['ayuda humanitaria', 2],
    ['campana solidaria', 2],
    ['beneficiarios', 1],
    ['comunidad vulnerable', 2],
    ['apoyo social', 1],
    ['volunteer', 2],
  ],
  INNOVACION_TECNOLOGIA: [
    ['hackathon', 2],
    ['prototipo', 2],
    ['repositorio', 2],
    ['github', 2],
    ['software', 2],
    ['aplicacion movil', 2],
    ['desarrollo web', 2],
    ['inteligencia artificial', 2],
    ['blockchain', 2],
    ['investigacion aplicada', 2],
    ['proyecto', 1],
    ['demo', 1],
    ['deploy', 1],
  ],
  LIDERAZGO_COMUNIDAD: [
    ['coordinador', 2],
    ['coordinacion', 2],
    ['organizador', 2],
    ['lidero', 2],
    ['dirigio', 2],
    ['meetup', 2],
    ['presidencia', 2],
    ['junta directiva', 2],
    ['a cargo de', 1],
    ['equipo de', 1],
    ['evento', 1],
  ],
  TRAYECTORIA: [
    ['practicas preprofesionales', 2],
    ['practicante', 2],
    ['contrato', 2],
    ['constancia de trabajo', 2],
    ['carta de recomendacion', 2],
    ['freelance', 2],
    ['cliente', 1],
    ['empleador', 2],
    ['desempeno laboral', 2],
    ['internship', 2],
  ],
};

/** Sin acentos y en minúsculas: los certificados llegan escritos de todas las formas. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('es');
}

const CATEGORIAS = Object.keys(LEXICO) as ExperienceCategory[];

/**
 * Propone categorías ordenadas por confianza. Devuelve SIEMPRE una lista, nunca
 * una sola respuesta: la UI muestra la mejor y deja cambiarla, porque quien
 * decide la categoría es el emisor.
 *
 * Lista vacía cuando ningún término casó. Es un resultado legítimo y hay que
 * mostrarlo como "sin clasificar" — inventar una categoría por defecto haría
 * que un hito casara por accidente.
 */
export function classifyCategory(rawText: string): CategoryGuess[] {
  const text = normalize(rawText);

  const crudos = CATEGORIAS.map((category) => {
    const matched: string[] = [];
    let peso = 0;

    for (const [termino, valor] of LEXICO[category]) {
      if (text.includes(normalize(termino))) {
        matched.push(termino);
        peso += valor;
      }
    }
    return { category, peso, matched };
  }).filter((guess) => guess.peso > 0);

  if (crudos.length === 0) return [];

  // La confianza es relativa al total observado: si un texto dispara términos
  // de tres categorías, ninguna se lleva un 1.0. Es lo honesto — un certificado
  // de "voluntariado en reforestacion" es genuinamente ambiguo, y la UI debe
  // reflejar esa duda en vez de esconderla.
  const total = crudos.reduce((suma, guess) => suma + guess.peso, 0);

  return crudos
    .map((guess) => ({
      category: guess.category,
      confidence: Math.round((guess.peso / total) * 100) / 100,
      matchedTerms: guess.matched,
    }))
    .sort(
      (left, right) =>
        right.confidence - left.confidence || left.category.localeCompare(right.category),
    );
}
