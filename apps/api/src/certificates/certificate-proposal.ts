import { readCertificate, type CertificateReading } from './certificate-reader';
import { classifyCategory, type CategoryGuess } from './classify-category';
import {
  extractSkillsFromText,
  resolveSkills,
  type ResolvedSkill,
} from './skill-taxonomy';

/**
 * Une lectura, clasificación y competencias en UNA propuesta. Ver 00-CONTEXT §2.2.
 *
 * ESTO ES UNA PROPUESTA, NO UNA VALIDACIÓN. El nombre del tipo lo dice para que
 * nadie lo confunda leyendo una firma de función. Lo que devuelve va a un
 * formulario donde un emisor autorizado confirma, corrige o descarta — igual que
 * las skills que propone la IA hoy.
 *
 * Lo único que este módulo sí valida es el VOCABULARIO: que "React.js" y
 * "reactjs" sean la misma competencia, con el mismo `skillId`. Eso es nuestro y
 * es determinista. Que el certificado sea auténtico no lo es.
 */

export interface CertificateProposal {
  fields: CertificateReading;
  /** Categorías candidatas, ordenadas. Vacío si nada casó. */
  categories: CategoryGuess[];
  /** Los "botoncitos": competencias canónicas propuestas. */
  skills: ResolvedSkill[];
  /** Lo que el usuario escribió y no reconocemos. Queda como texto libre. */
  unmatchedSkills: string[];
  /**
   * Siempre `false`. Existe para que ninguna UI tenga que deducirlo: una
   * propuesta jamás llega verificada.
   */
  verified: false;
}

/**
 * @param rawText  El certificado convertido a texto plano.
 * @param declaredSkills  Competencias que el usuario escribió a mano, si las hay.
 */
export function proposeFromCertificate(
  rawText: string,
  declaredSkills: string[] = [],
): CertificateProposal {
  const fields = readCertificate(rawText);
  const categories = classifyCategory(rawText);

  // Dos fuentes: lo que el usuario declaró y lo que dice el texto. Se resuelven
  // contra la misma taxonomia, asi que "React.js" escrito a mano y "react" leido
  // del PDF terminan en una sola competencia con un solo skillId.
  const declaradas = resolveSkills(declaredSkills);
  const delTexto = extractSkillsFromText(rawText);

  const combinadas = new Map<string, ResolvedSkill>();
  for (const skill of [...declaradas.resolved, ...delTexto]) {
    const previo = combinadas.get(skill.key);
    if (!previo) {
      combinadas.set(skill.key, { ...skill, matchedFrom: [...skill.matchedFrom] });
      continue;
    }
    for (const origen of skill.matchedFrom) {
      if (!previo.matchedFrom.includes(origen)) previo.matchedFrom.push(origen);
    }
  }

  return {
    fields,
    categories,
    skills: [...combinadas.values()],
    unmatchedSkills: declaradas.unmatched,
    verified: false,
  };
}
