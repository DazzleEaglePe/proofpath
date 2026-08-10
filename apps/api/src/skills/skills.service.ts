import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ExperienceRepository } from '../repositories/experience.repository';
import { SkillRepository } from '../repositories/skill.repository';
import { SKILL_EXTRACTOR, type SkillExtractor } from './skill-extractor';

export interface SkillView {
  id: string;
  name: string;
  type: 'HARD' | 'HUMAN';
  source: 'AI_SUGGESTED' | 'ORG_ADDED';
  confirmed: boolean;
}

export interface UpdateSkillsInput {
  confirm?: string[];
  discard?: string[];
  add?: Array<{ name: string; type: 'HARD' | 'HUMAN' }>;
}

/**
 * El pipeline de 00-CONTEXT.md §2.2:
 *
 *   evidencia → la IA PROPONE → la organizacion confirma → emision
 *
 * Las tres operaciones de aqui son los tres primeros pasos. La cuarta la hace
 * `IssuanceService`, que se niega a emitir si nadie confirmo nada.
 *
 * Que la IA no pueda emitir no es un detalle de implementacion: es el argumento
 * etico del proyecto, y por eso vive en el service layer y esta cubierto por
 * tests en los dos servicios.
 */
@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    private readonly experiences: ExperienceRepository,
    private readonly skills: SkillRepository,
    @Inject(SKILL_EXTRACTOR) private readonly extractor: SkillExtractor,
  ) {}

  /** Paso 2: la IA propone. Nada de lo que sale de aqui queda confirmado. */
  async extract(
    experienceId: string,
    organizationId: string,
  ): Promise<{ experienceId: string; suggested: SkillView[] }> {
    const exp = await this.loadOwned(experienceId, organizationId);
    this.assertEditable(exp.status, 'Cambiar sus skills invalidaria el hash anclado en la cadena.');

    const propuestas = await this.extractor.extract({
      programTitle: exp.program.title,
      role: exp.role,
      contributions: exp.contributions,
      evidences: exp.evidences.map((e) => ({ type: e.type, url: e.url, label: e.label })),
    });

    await this.skills.upsertSuggestions(experienceId, propuestas);

    // DRAFT → AI_ANALYZED. Si ya estaba confirmada, no se retrocede el estado.
    if (exp.status === 'DRAFT') {
      await this.experiences.updateStatus(experienceId, 'AI_ANALYZED');
    }

    const todas = await this.skills.findByExperience(experienceId);
    this.logger.log(
      `${propuestas.length} skills propuestas por ${this.extractor.name} para ${experienceId}`,
    );

    return { experienceId, suggested: todas.map(toView) };
  }

  /** Paso 3: la organizacion confirma, descarta o agrega a mano. */
  async update(
    experienceId: string,
    input: UpdateSkillsInput,
    organizationId: string,
  ): Promise<SkillView[]> {
    const exp = await this.loadOwned(experienceId, organizationId);
    this.assertEditable(exp.status, 'Para corregirla hay que revocar y volver a emitir.');

    if (input.discard?.length) await this.skills.discardMany(experienceId, input.discard);
    if (input.confirm?.length) await this.skills.confirmMany(experienceId, input.confirm);
    if (input.add?.length) await this.skills.addManual(experienceId, input.add);

    return (await this.skills.findByExperience(experienceId)).map(toView);
  }

  /**
   * Cierra la confirmacion humana y deja la experiencia lista para emitir.
   *
   * Exige al menos una skill confirmada. Sin eso, `IssuanceService` la rechazaria
   * igual, pero fallar aqui le da a la ONG un error claro en su pantalla en vez
   * de un rechazo al momento de emitir el batch entero.
   */
  async confirmExperience(
    experienceId: string,
    organizationId: string,
  ): Promise<{ id: string; status: string }> {
    await this.loadOwned(experienceId, organizationId);

    const confirmadas = await this.skills.countConfirmed(experienceId);
    if (confirmadas === 0) {
      throw new BadRequestException({
        error: 'SkillsNotConfirmed',
        message:
          'La organizacion debe confirmar al menos una skill antes de dar la experiencia por lista. La IA propone, el humano confirma.',
      });
    }

    const actualizada = await this.experiences.updateStatus(experienceId, 'ORG_CONFIRMED');
    return { id: actualizada.id, status: actualizada.status };
  }

  async list(experienceId: string, organizationId: string): Promise<SkillView[]> {
    await this.loadOwned(experienceId, organizationId);
    return (await this.skills.findByExperience(experienceId)).map(toView);
  }

  /**
   * Carga la experiencia comprobando que pertenezca a quien llama.
   *
   * Un unico punto de entrada para las cuatro operaciones: si mañana se agrega
   * una quinta, tiene que pasar por aqui para obtener la experiencia, y hereda
   * la comprobacion sin que nadie se acuerde de escribirla.
   */
  private async loadOwned(experienceId: string, organizationId: string) {
    const exp = await this.experiences.findOneForExtraction(experienceId);
    if (!exp) {
      throw new NotFoundException({
        error: 'ExperienceNotFound',
        message: `No existe la experiencia ${experienceId}`,
      });
    }

    if (exp.program.organizationId !== organizationId) {
      throw new ForbiddenException({
        error: 'NotYourExperience',
        message: 'Esta experiencia pertenece a otra organizacion',
      });
    }

    return exp;
  }

  private assertEditable(status: string, detalle: string): void {
    if (status === 'ISSUED') {
      throw new BadRequestException({
        error: 'ExperienceAlreadyIssued',
        message: `Esta experiencia ya tiene credencial emitida. ${detalle}`,
      });
    }
  }
}

function toView(s: {
  id: string;
  name: string;
  type: string;
  source: string;
  confirmed: boolean;
}): SkillView {
  // Sin nivel, sin porcentaje, sin puntaje. Ver 00-CONTEXT.md §2.1.
  return {
    id: s.id,
    name: s.name,
    type: s.type as 'HARD' | 'HUMAN',
    source: s.source as 'AI_SUGGESTED' | 'ORG_ADDED',
    confirmed: s.confirmed,
  };
}
