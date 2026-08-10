import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { summarizeSkills, type SkillSummary } from '../common/skills-summary';
import type { EvidenceType } from '../generated/prisma/enums';
import { ExperienceRepository } from '../repositories/experience.repository';
import { TalentRepository } from '../repositories/talent.repository';

export interface TalentPassResponse {
  profileId: string;
  fullName: string;
  tokenId: string | null;
  walletAddress: string | null;
  isVerified: boolean;
  experienceCount: number;
  skills: SkillSummary[];
}

export interface ExperienceListItem {
  id: string;
  programTitle: string;
  organizationName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  status: string;
  isVerified: boolean;
  txHash: string | null;
}

export interface CreateExperienceInput {
  programId: string;
  role: string;
  contributions: string;
  hoursCommitted?: number;
  startDate: string;
  endDate?: string;
  evidences: Array<{ type: EvidenceType; url: string; label: string }>;
}

/**
 * Superficie del talento — 04-IOS-APP.md §3.
 *
 * El voluntario **nunca firma nada**: aqui solo lee y crea borradores. Quien
 * firma y emite es la organizacion desde el dashboard web. Por eso no hay ni un
 * solo endpoint de escritura sobre skills en este servicio: las propone la IA y
 * las confirma la ONG.
 */
@Injectable()
export class TalentService {
  constructor(
    private readonly talents: TalentRepository,
    private readonly experiences: ExperienceRepository,
  ) {}

  async talentPass(profileId: string): Promise<TalentPassResponse> {
    const profile = await this.talents.findWithIssuedCredentials(profileId);
    if (!profile) {
      throw new NotFoundException({
        error: 'ProfileNotFound',
        message: 'No existe el perfil',
      });
    }

    const vigentes = profile.credentials.filter((c) => c.status !== 'REVOKED');

    return {
      profileId: profile.id,
      fullName: profile.fullName,
      tokenId: profile.tokenId?.toString() ?? null,
      walletAddress: profile.walletAddress,
      isVerified: vigentes.length > 0,
      experienceCount: vigentes.length,
      skills: summarizeSkills(vigentes),
    };
  }

  async listExperiences(profileId: string): Promise<ExperienceListItem[]> {
    const lista = await this.experiences.findManyByTalent(profileId);

    return lista.map((e) => ({
      id: e.id,
      programTitle: e.program.title,
      organizationName: e.program.organization.name,
      role: e.role,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      status: e.status,
      isVerified: e.credential?.status === 'ISSUED',
      txHash: e.credential?.batch?.txHash ?? null,
    }));
  }

  async skillsSummary(profileId: string): Promise<SkillSummary[]> {
    const profile = await this.talents.findWithIssuedCredentials(profileId);
    if (!profile) {
      throw new NotFoundException({ error: 'ProfileNotFound', message: 'No existe el perfil' });
    }
    // Solo cuenta skills confirmadas de credenciales emitidas: una skill que la
    // IA propuso y nadie confirmo no existe para este endpoint.
    return summarizeSkills(profile.credentials.filter((c) => c.status !== 'REVOKED'));
  }

  async experienceDetail(experienceId: string, profileId: string) {
    const exp = await this.experiences.findOneDetailed(experienceId);
    if (!exp) {
      throw new NotFoundException({
        error: 'ExperienceNotFound',
        message: `No existe la experiencia ${experienceId}`,
      });
    }

    // El talento solo ve las suyas.
    if (exp.talentProfileId !== profileId) {
      throw new ForbiddenException({
        error: 'NotYourExperience',
        message: 'Esta experiencia pertenece a otra persona',
      });
    }

    return {
      id: exp.id,
      programTitle: exp.program.title,
      organizationName: exp.program.organization.name,
      role: exp.role,
      contributions: exp.contributions,
      hoursCommitted: exp.hoursCommitted,
      startDate: exp.startDate.toISOString(),
      endDate: exp.endDate?.toISOString() ?? null,
      status: exp.status,
      evidences: exp.evidences.map((e) => ({ type: e.type, url: e.url, label: e.label })),
      skills: {
        hard: exp.skillClaims.filter((s) => s.type === 'HARD').map((s) => s.name),
        human: exp.skillClaims.filter((s) => s.type === 'HUMAN').map((s) => s.name),
      },
      credential: exp.credential
        ? {
            credentialHash: exp.credential.credentialHash,
            isVerified: exp.credential.status === 'ISSUED',
            txHash: exp.credential.batch?.txHash ?? null,
            batchId: exp.credential.batch?.onChainBatchId?.toString() ?? null,
          }
        : null,
    };
  }

  async createExperience(profileId: string, input: CreateExperienceInput) {
    const programa = await this.experiences.programExists(input.programId);
    if (!programa) {
      throw new BadRequestException({
        error: 'ProgramNotFound',
        message: `No existe el programa ${input.programId}`,
      });
    }

    const creada = await this.experiences.createDraft({
      programId: input.programId,
      talentProfileId: profileId,
      role: input.role,
      contributions: input.contributions,
      hoursCommitted: input.hoursCommitted,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      evidences: input.evidences,
    });

    return {
      id: creada.id,
      status: creada.status,
      organizationName: creada.program.organization.name,
      // Lo que la app muestra: "Enviada a [Organización] para validación".
      message: `Enviada a ${creada.program.organization.name} para validación`,
    };
  }
}
