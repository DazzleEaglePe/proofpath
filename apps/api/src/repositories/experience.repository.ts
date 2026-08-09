import { Injectable } from '@nestjs/common';
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
}

export type IssuableExperience = Awaited<
  ReturnType<ExperienceRepository['findManyForIssuance']>
>[number];
