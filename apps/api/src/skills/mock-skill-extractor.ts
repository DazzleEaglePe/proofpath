import { Injectable, Logger } from '@nestjs/common';
import type { ExtractionInput, SkillExtractor, SuggestedSkill } from './skill-extractor';

/**
 * Extractor sin modelo — plan B y motor de los tests.
 *
 * No inventa: busca terminos en el texto de las contribuciones y en el rol. Es
 * pobre comparado con el modelo, pero produce propuestas coherentes con lo que
 * la persona realmente escribio, que es lo que la pantalla necesita mostrar.
 *
 * Igual que el mock de la cadena, esto NO es una fachada que devuelve algo fijo:
 * si la ONG cambia el texto, cambian las propuestas.
 */
@Injectable()
export class MockSkillExtractor implements SkillExtractor {
  readonly name = 'mock' as const;

  private readonly logger = new Logger(MockSkillExtractor.name);

  private static readonly HARD: Array<[RegExp, string]> = [
    [/\breact\b/i, 'React'],
    [/\btypescript\b/i, 'TypeScript'],
    [/\bnode|nest|backend\b/i, 'Backend'],
    [/\bapi[s]?\b/i, 'REST APIs'],
    [/\bdashboard|panel\b/i, 'Desarrollo de interfaces'],
    [/\bautenticaci[oó]n|login\b/i, 'Autenticación'],
    [/\bdise[nñ]|figma|prototip/i, 'Diseño de producto'],
    [/\bentrevista|investigaci[oó]n|usuari/i, 'Investigación con usuarios'],
    [/\bdatos|sql|base de datos\b/i, 'Manejo de datos'],
    [/\bcalendario|agenda|cronograma\b/i, 'Gestión de proyectos'],
    [/\bdocument|manual\b/i, 'Documentación'],
  ];

  private static readonly HUMAN: Array<[RegExp, string]> = [
    [/\bcoordin|lider|organic[eé]\b/i, 'Coordinación de equipos'],
    [/\bequipo|junto|colabor|con dos|con tres\b/i, 'Colaboración'],
    [/\bcomunic|present|explic\b/i, 'Comunicación'],
    [/\bconflicto|resolv|problema\b/i, 'Resolución de problemas'],
    [/\bajust[eé]|iter|mejor\b/i, 'Adaptabilidad'],
    [/\bsolo|por mi cuenta|autonom\b/i, 'Autonomía'],
    [/\bense[nñ]|mentor|acompa[nñ]\b/i, 'Mentoría'],
  ];

  async extract(input: ExtractionInput): Promise<SuggestedSkill[]> {
    this.logger.warn('Extractor en modo MOCK: las skills salen del texto, no de un modelo.');

    const texto = `${input.role} ${input.contributions} ${input.evidences.map((e) => e.label).join(' ')}`;
    const skills: SuggestedSkill[] = [];

    for (const [patron, nombre] of MockSkillExtractor.HARD) {
      if (patron.test(texto)) skills.push({ name: nombre, type: 'HARD' });
    }
    for (const [patron, nombre] of MockSkillExtractor.HUMAN) {
      if (patron.test(texto)) skills.push({ name: nombre, type: 'HUMAN' });
    }

    // Una experiencia siempre demuestra algo, aunque el texto sea escueto.
    if (skills.length === 0) {
      skills.push({ name: 'Compromiso', type: 'HUMAN' });
    }

    return skills.slice(0, 8);
  }
}
