import { Injectable, Logger } from '@nestjs/common';
import {
  SYSTEM_PROMPT,
  type ExtractionInput,
  type SkillExtractor,
  type SuggestedSkill,
} from './skill-extractor';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 20_000;

/**
 * Extraccion con GPT-4o-mini (00-CONTEXT.md §6).
 *
 * Sin SDK: es una sola llamada HTTP y `fetch` alcanza. Una dependencia menos que
 * instalar y que mantener.
 */
@Injectable()
export class OpenAiSkillExtractor implements SkillExtractor {
  readonly name = 'openai' as const;

  private readonly logger = new Logger(OpenAiSkillExtractor.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('Falta OPENAI_API_KEY. Para trabajar sin modelo real usa SKILL_EXTRACTOR=MOCK.');
    }
    this.apiKey = key;
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  }

  async extract(input: ExtractionInput): Promise<SuggestedSkill[]> {
    // Un request colgado es peor que un error: la ONG se queda mirando un spinner
    // delante del jurado.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: this.userPrompt(input) },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI respondio ${res.status}: ${await res.text()}`);
      }

      const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error('OpenAI devolvio una respuesta sin contenido');

      return parseSuggestions(content);
    } finally {
      clearTimeout(timer);
    }
  }

  private userPrompt(input: ExtractionInput): string {
    const evidencias = input.evidences.length
      ? input.evidences.map((e) => `- ${e.type}: ${e.label} (${e.url})`).join('\n')
      : '- (sin evidencias adjuntas)';

    return [
      `Programa: ${input.programTitle}`,
      `Rol: ${input.role}`,
      '',
      'Contribuciones descritas por la persona:',
      input.contributions,
      '',
      'Evidencias adjuntas:',
      evidencias,
    ].join('\n');
  }
}

/**
 * Valida y limpia lo que devuelve el modelo. Un modelo puede alucinar un campo
 * `level` aunque el prompt lo prohiba, asi que aqui se descarta todo lo que no
 * sea `name` y `type`: la prohibicion de puntajes no depende de que el modelo
 * obedezca.
 */
export function parseSuggestions(raw: string): SuggestedSkill[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`El modelo no devolvio JSON valido: ${raw.slice(0, 200)}`);
  }

  const skills = (parsed as { skills?: unknown }).skills;
  if (!Array.isArray(skills)) {
    throw new Error('El modelo no devolvio un array "skills"');
  }

  const vistos = new Set<string>();
  const limpias: SuggestedSkill[] = [];

  for (const s of skills) {
    if (typeof s !== 'object' || s === null) continue;
    const { name, type } = s as { name?: unknown; type?: unknown };

    if (typeof name !== 'string') continue;
    const nombre = name.trim();
    if (!nombre || nombre.length > 60) continue;

    const tipo = String(type).toUpperCase();
    if (tipo !== 'HARD' && tipo !== 'HUMAN') continue;

    const clave = nombre.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);

    limpias.push({ name: nombre, type: tipo });
  }

  return limpias;
}
