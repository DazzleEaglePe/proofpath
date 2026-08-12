import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { summarizeSkills, type SkillSummary } from '../common/skills-summary';
import type { EvidenceType } from '../generated/prisma/enums';
import { ExperienceRepository } from '../repositories/experience.repository';
import { RouteRepository } from '../repositories/route.repository';
import { TalentRepository } from '../repositories/talent.repository';
import {
  type EducationStatusInput,
  type OpportunityModalityInput,
  type UpdateDiscoveryProfileDto,
} from './dto/update-discovery-profile.dto';
import { recommendOpportunities } from './recommend-opportunities';
import { computeRouteProgress, type TalentEvidence } from './route-progress';

export interface TalentPassResponse {
  profileId: string;
  fullName: string;
  email: string;
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

export interface DiscoveryProfileResponse {
  fullName: string;
  email: string;
  headline: string | null;
  educationStatus: EducationStatusInput | null;
  fieldOfStudy: string | null;
  institutionName: string | null;
  academicCycle: number | null;
  city: string | null;
  weeklyAvailabilityHours: number | null;
  preferredModalities: OpportunityModalityInput[];
  causeInterests: string[];
  roleInterests: string[];
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
    private readonly routes: RouteRepository,
  ) {}

  /**
   * Un token cuyo sujeto ya no existe es una SESION INVALIDA, no un recurso que
   * falta: por eso 401 y no 404.
   *
   * Importa en la practica: si alguien resiembra la base entre ensayos, la app
   * queda con un token colgando. Con 404 mostraba "Algo salio mal" y no habia
   * forma de salir desde adentro; con 401 el cliente sabe que tiene que limpiar
   * la sesion y volver al onboarding.
   */
  private sesionInvalida(): never {
    throw new UnauthorizedException({
      error: 'SessionInvalid',
      message: 'Tu sesion ya no es valida. Volvé a crear tu TalentPass.',
    });
  }

  async talentPass(profileId: string): Promise<TalentPassResponse> {
    const profile = await this.talents.findWithIssuedCredentials(profileId);
    if (!profile) this.sesionInvalida();

    const vigentes = profile.credentials.filter((c) => c.status !== 'REVOKED');

    return {
      profileId: profile.id,
      fullName: profile.fullName,
      email: profile.email,
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
      this.sesionInvalida();
    }
    // Solo cuenta skills confirmadas de credenciales emitidas: una skill que la
    // IA propuso y nadie confirmo no existe para este endpoint.
    return summarizeSkills(
      profile.credentials.filter((c) => c.status !== 'REVOKED'),
    );
  }

  async discoveryProfile(profileId: string): Promise<DiscoveryProfileResponse> {
    const profile = await this.talents.findById(profileId);
    if (!profile) this.sesionInvalida();
    return this.toDiscoveryProfile(profile);
  }

  async updateDiscoveryProfile(
    profileId: string,
    input: UpdateDiscoveryProfileDto,
  ): Promise<DiscoveryProfileResponse> {
    const current = await this.talents.findById(profileId);
    if (!current) this.sesionInvalida();

    const clean = (value: string | undefined): string | null | undefined => {
      if (value === undefined) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };
    const cleanList = (values: string[] | undefined): string[] | undefined =>
      values?.map((value) => value.trim()).filter(Boolean);

    const updated = await this.talents.updateDiscoveryProfile(profileId, {
      headline: clean(input.headline),
      educationStatus: input.educationStatus,
      fieldOfStudy: clean(input.fieldOfStudy),
      institutionName: clean(input.institutionName),
      academicCycle: input.academicCycle,
      city: clean(input.city),
      weeklyAvailabilityHours: input.weeklyAvailabilityHours,
      preferredModalities: input.preferredModalities,
      causeInterests: cleanList(input.causeInterests),
      roleInterests: cleanList(input.roleInterests),
    });
    return this.toDiscoveryProfile(updated);
  }

  async recommendedOpportunities(profileId: string) {
    const profile = await this.talents.findWithIssuedCredentials(profileId);
    if (!profile) this.sesionInvalida();

    const programs = await this.experiences.listOpenPrograms();
    const verifiedSkills = summarizeSkills(
      profile.credentials.filter((credential) => credential.status !== 'REVOKED'),
    ).map((skill) => skill.name);

    return recommendOpportunities(
      {
        fieldOfStudy: profile.fieldOfStudy,
        city: profile.city,
        weeklyAvailabilityHours: profile.weeklyAvailabilityHours,
        preferredModalities: profile.preferredModalities,
        causeInterests: profile.causeInterests,
        roleInterests: profile.roleInterests,
      },
      verifiedSkills,
      programs.map((program) => ({
        id: program.id,
        title: program.title,
        description: program.description,
        organizationName: program.organization.name,
        organizationIsTrusted: program.organization.isTrusted,
        cause: program.cause,
        modality: program.modality,
        location: program.location,
        weeklyHours: program.weeklyHours,
        applicationDeadline: program.applicationDeadline,
        requiredSkills: program.requiredSkills,
        startDate: program.startDate,
        endDate: program.endDate,
      })),
    ).map((opportunity) => ({
      ...opportunity,
      startDate: opportunity.startDate.toISOString(),
      endDate: opportunity.endDate?.toISOString() ?? null,
      applicationDeadline: opportunity.applicationDeadline?.toISOString() ?? null,
    }));
  }

  /**
   * Rutas abiertas con el avance del talento. Ver 00-CONTEXT §2.5.
   *
   * El avance se recomputa aqui en cada request y no se guarda: no hay columna
   * ni cache con el progreso de nadie. La categoria de una credencial es el
   * `cause` de su programa — el mismo campo con el que ya se recomienda, para
   * que una ONG no tenga que mantener dos taxonomias.
   */
  async myRoutes(profileId: string) {
    const profile = await this.talents.findWithIssuedCredentials(profileId);
    if (!profile) this.sesionInvalida();

    const pendientes = await this.routes.findPendingExperiences(profileId);

    const evidence: TalentEvidence = {
      // findWithIssuedCredentials ya filtra por status ISSUED, asi que lo
      // revocado no llega hasta aqui. Se mapea explicito igual: si esa query
      // cambia algun dia, el motor sigue decidiendo bien.
      issued: profile.credentials.map((credential) => ({
        category: credential.experience.program.cause ?? '',
        skills: credential.experience.skillClaims.map((skill) => skill.name),
        hours: credential.experience.hoursCommitted,
        organizationName: credential.organization.name,
        revoked: credential.status === 'REVOKED',
      })),
      pending: pendientes.map((experience) => ({
        category: experience.program.cause ?? '',
        skills: experience.skillClaims.map((skill) => skill.name),
      })),
    };

    const rutas = await this.routes.listOpenWithMilestones();

    return rutas.map((route) => ({
      id: route.id,
      title: route.title,
      description: route.description,
      organizationName: route.organization.name,
      organizationIsTrusted: route.organization.isTrusted,
      closesAt: route.closesAt?.toISOString() ?? null,
      progress: computeRouteProgress(
        route.milestones.map((milestone) => ({
          id: milestone.id,
          order: milestone.order,
          title: milestone.title,
          kind: milestone.kind,
          category: milestone.category,
          skillName: milestone.skillName,
          requiredHours: milestone.requiredHours,
        })),
        evidence,
      ),
    }));
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
      evidences: exp.evidences.map((e) => ({
        type: e.type,
        url: e.url,
        label: e.label,
      })),
      skills: {
        hard: exp.skillClaims
          .filter((s) => s.type === 'HARD')
          .map((s) => s.name),
        human: exp.skillClaims
          .filter((s) => s.type === 'HUMAN')
          .map((s) => s.name),
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

  /** Programas que el talento puede asociar a una experiencia ya realizada. */
  async availablePrograms(): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      organizationName: string;
      organizationIsTrusted: boolean;
      cause: string | null;
      modality: string;
      location: string | null;
      weeklyHours: number | null;
      applicationDeadline: string | null;
      requiredSkills: string[];
      startDate: string;
      endDate: string | null;
    }>
  > {
    const programas = await this.experiences.listPrograms();

    return programas.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      organizationName: p.organization.name,
      organizationIsTrusted: p.organization.isTrusted,
      cause: p.cause,
      modality: p.modality,
      location: p.location,
      weeklyHours: p.weeklyHours,
      applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
      requiredSkills: p.requiredSkills,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate?.toISOString() ?? null,
    }));
  }

  private toDiscoveryProfile(profile: {
    fullName: string;
    email: string;
    headline: string | null;
    educationStatus: string | null;
    fieldOfStudy: string | null;
    institutionName: string | null;
    academicCycle: number | null;
    city: string | null;
    weeklyAvailabilityHours: number | null;
    preferredModalities: string[];
    causeInterests: string[];
    roleInterests: string[];
  }): DiscoveryProfileResponse {
    return {
      fullName: profile.fullName,
      email: profile.email,
      headline: profile.headline,
      educationStatus: profile.educationStatus as EducationStatusInput | null,
      fieldOfStudy: profile.fieldOfStudy,
      institutionName: profile.institutionName,
      academicCycle: profile.academicCycle,
      city: profile.city,
      weeklyAvailabilityHours: profile.weeklyAvailabilityHours,
      preferredModalities: profile.preferredModalities as OpportunityModalityInput[],
      causeInterests: profile.causeInterests,
      roleInterests: profile.roleInterests,
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
