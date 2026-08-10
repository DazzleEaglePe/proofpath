import { Injectable } from '@nestjs/common';
import type { EvidenceType, ExperienceStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Acceso a experiencias. Los servicios no tocan Prisma directo (00-CONTEXT.md §7).
 */
@Injectable()
export class ExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trae todo lo que hace falta para construir el VC de cada experiencia.
   *
   * `skillClaims` viene filtrado a `confirmed: true` a proposito: las skills que
   * solo propuso la IA no deben poder colarse dentro de una credencial emitida.
   * Filtrar aqui, en la consulta, hace imposible el olvido mas adelante.
   */
  findManyForIssuance(ids: string[]) {
    return this.prisma.experience.findMany({
      where: { id: { in: ids } },
      include: {
        program: { include: { organization: true } },
        talentProfile: true,
        evidences: true,
        skillClaims: { where: { confirmed: true }, orderBy: { name: 'asc' } },
      },
    });
  }

  /** Lo que necesita el extractor de skills: el texto y las evidencias. */
  findOneForExtraction(id: string) {
    return this.prisma.experience.findUnique({
      where: { id },
      include: { program: true, evidences: true },
    });
  }

  updateStatus(id: string, status: ExperienceStatus) {
    return this.prisma.experience.update({ where: { id }, data: { status } });
  }

  /** Experiencias del talento, con lo que la app necesita para la lista. */
  findManyByTalent(talentProfileId: string) {
    return this.prisma.experience.findMany({
      where: { talentProfileId },
      include: {
        program: { include: { organization: true } },
        credential: { include: { batch: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Detalle completo de una experiencia, para la pantalla de detalle. */
  findOneDetailed(id: string) {
    return this.prisma.experience.findUnique({
      where: { id },
      include: {
        program: { include: { organization: true } },
        evidences: true,
        skillClaims: { where: { confirmed: true }, orderBy: { name: 'asc' } },
        credential: { include: { batch: true } },
      },
    });
  }

  createDraft(data: {
    programId: string;
    talentProfileId: string;
    role: string;
    contributions: string;
    hoursCommitted?: number;
    startDate: Date;
    endDate?: Date;
    evidences: Array<{ type: EvidenceType; url: string; label: string }>;
  }) {
    return this.prisma.experience.create({
      data: {
        programId: data.programId,
        talentProfileId: data.talentProfileId,
        role: data.role,
        contributions: data.contributions,
        hoursCommitted: data.hoursCommitted,
        startDate: data.startDate,
        endDate: data.endDate,
        // Queda esperando que la ONG la analice y confirme (06-API-SPEC §3).
        status: 'DRAFT',
        evidences: { create: data.evidences },
      },
      include: { program: { include: { organization: true } }, evidences: true },
    });
  }

  programExists(programId: string) {
    return this.prisma.program.findUnique({ where: { id: programId } });
  }

  /**
   * Programas abiertos, para que el talento elija a cual postular.
   *
   * Sin esto la app pedia escribir el id a mano, que es lo unico del flujo que
   * un usuario real no podria saber.
   */
  listOpenPrograms() {
    return this.prisma.program.findMany({
      include: { organization: { select: { name: true, isTrusted: true } } },
      orderBy: { startDate: 'desc' },
    });
  }
}

export type IssuableExperience = Awaited<
  ReturnType<ExperienceRepository['findManyForIssuance']>
>[number];
