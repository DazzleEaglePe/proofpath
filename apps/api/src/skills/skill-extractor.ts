/**
 * Puerto de extraccion de skills — 00-CONTEXT.md §2.2.
 *
 * Dos implementaciones, igual que `ChainAdapter` y por la misma razon: si la API
 * del modelo se cae o la sala no tiene red, la demo tiene que seguir. El flujo
 * que se muestra en pantalla es identico; lo unico que cambia es de donde salen
 * las propuestas.
 *
 * REGLA DURA: esto **propone**, nunca emite. Todo lo que salga de aqui nace con
 * `confirmed: false` y necesita que un humano de la organizacion lo confirme
 * antes de poder entrar en una credencial.
 */
export const SKILL_EXTRACTOR = Symbol('SKILL_EXTRACTOR');

export interface ExtractionInput {
  programTitle: string;
  role: string;
  contributions: string;
  evidences: Array<{ type: string; url: string; label: string }>;
}

export interface SuggestedSkill {
  name: string;
  /** HARD: tecnica. HUMAN: competencia humana observada en contexto (00-CONTEXT §8). */
  type: 'HARD' | 'HUMAN';
}

export interface SkillExtractor {
  readonly name: 'openai' | 'mock';
  extract(input: ExtractionInput): Promise<SuggestedSkill[]>;
}

/**
 * Instruccion compartida por las dos implementaciones, para que el mock proponga
 * cosas del mismo estilo que el modelo real.
 *
 * Notar lo que NO se pide: ni niveles, ni porcentajes, ni puntajes, ni años de
 * experiencia. El modelo solo nombra capacidades observables en el texto.
 */
export const SYSTEM_PROMPT = `Eres un analista de recursos humanos que lee la descripcion de una experiencia de voluntariado o proyecto y nombra las capacidades que quedan demostradas en ella.

Reglas:
- Propon entre 3 y 8 capacidades en total.
- Clasifica cada una como HARD (tecnica, herramienta, metodo) o HUMAN (competencia humana observada en contexto).
- Usa "human" y nunca "soft": son competencias humanas, no habilidades blandas.
- Nombra solo lo que el texto respalda. Si algo no esta evidenciado, no lo inventes.
- Nombres cortos en espanol, salvo tecnologias que se nombran en ingles (React, TypeScript).
- PROHIBIDO: niveles, porcentajes, puntajes, estrellas, años de experiencia o cualquier medida de cuanto domina la persona algo. Solo el nombre de la capacidad.

Responde unicamente con JSON valido con esta forma:
{"skills":[{"name":"React","type":"HARD"},{"name":"Colaboracion","type":"HUMAN"}]}`;
