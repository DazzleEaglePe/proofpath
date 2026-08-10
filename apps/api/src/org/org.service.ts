import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '../repositories/organization.repository';

export interface OrgProgramView {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  experiences: Array<{
    id: string;
    talentName: string;
    tokenId: string | null;
    role: string;
    contributions: string;
    hoursCommitted: number | null;
    status: string;
    evidences: Array<{ type: string; url: string; label: string }>;
    skills: Array<{
      id: string;
      name: string;
      type: 'HARD' | 'HUMAN';
      source: 'AI_SUGGESTED' | 'ORG_ADDED';
      confirmed: boolean;
    }>;
  }>;
}

/** Lo que el dashboard de la ONG necesita para el bloque 0:45–1:30 de la demo. */
@Injectable()
export class OrgService {
  constructor(private readonly organizations: OrganizationRepository) {}

  async me(organizationId: string) {
    const org = await this.organizations.findById(organizationId);
    if (!org) {
      throw new NotFoundException({ error: 'OrganizationNotFound', message: 'No existe la organizacion' });
    }
    return {
      id: org.id,
      name: org.name,
      description: org.description,
      isTrusted: org.isTrusted,
      walletAddress: org.walletAddress,
    };
  }

  async programs(organizationId: string): Promise<OrgProgramView[]> {
    const programas = await this.organizations.findProgramsWithExperiences(organizationId);

    return programas.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate?.toISOString() ?? null,
      experiences: p.experiences.map((e) => ({
        id: e.id,
        talentName: e.talentProfile.fullName,
        tokenId: e.talentProfile.tokenId?.toString() ?? null,
        role: e.role,
        contributions: e.contributions,
        hoursCommitted: e.hoursCommitted,
        status: e.status,
        evidences: e.evidences.map((ev) => ({ type: ev.type, url: ev.url, label: ev.label })),
        skills: e.skillClaims.map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type as 'HARD' | 'HUMAN',
          source: s.source as 'AI_SUGGESTED' | 'ORG_ADDED',
          confirmed: s.confirmed,
        })),
      })),
    }));
  }
}
