import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(contactEmail: string) {
    return this.prisma.organization.findFirst({
      where: { contactEmail: contactEmail.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  /** Programas de la organizacion con sus experiencias, para el dashboard. */
  findProgramsWithExperiences(organizationId: string) {
    return this.prisma.program.findMany({
      where: { organizationId },
      include: {
        experiences: {
          include: {
            talentProfile: { select: { id: true, fullName: true, tokenId: true } },
            skillClaims: { orderBy: { name: 'asc' } },
            evidences: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
