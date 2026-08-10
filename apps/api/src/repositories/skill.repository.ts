import { Injectable } from '@nestjs/common';
import type { SkillType } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByExperience(experienceId: string) {
    return this.prisma.skillClaim.findMany({
      where: { experienceId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Guarda las propuestas del modelo. Idempotente por `(experienceId, name)`:
   * volver a pedir el analisis no duplica skills ni pisa lo que la ONG ya
   * confirmo o corrigio a mano.
   */
  async upsertSuggestions(
    experienceId: string,
    skills: Array<{ name: string; type: SkillType }>,
  ) {
    for (const skill of skills) {
      await this.prisma.skillClaim.upsert({
        where: { experienceId_name: { experienceId, name: skill.name } },
        // Si ya existe no se toca: puede estar confirmada, y una segunda pasada
        // del modelo no debe revertir una decision humana.
        update: {},
        create: {
          experienceId,
          name: skill.name,
          type: skill.type,
          source: 'AI_SUGGESTED',
          confirmed: false,
        },
      });
    }
    return this.findByExperience(experienceId);
  }

  confirmMany(experienceId: string, skillIds: string[]) {
    return this.prisma.skillClaim.updateMany({
      where: { id: { in: skillIds }, experienceId },
      data: { confirmed: true, confirmedAt: new Date() },
    });
  }

  discardMany(experienceId: string, skillIds: string[]) {
    return this.prisma.skillClaim.deleteMany({
      where: { id: { in: skillIds }, experienceId },
    });
  }

  /** Lo que agrega la ONG a mano nace confirmado: lo escribio un humano. */
  addManual(experienceId: string, skills: Array<{ name: string; type: SkillType }>) {
    return this.prisma.$transaction(
      skills.map((s) =>
        this.prisma.skillClaim.upsert({
          where: { experienceId_name: { experienceId, name: s.name } },
          update: { confirmed: true, confirmedAt: new Date(), source: 'ORG_ADDED' },
          create: {
            experienceId,
            name: s.name,
            type: s.type,
            source: 'ORG_ADDED',
            confirmed: true,
            confirmedAt: new Date(),
          },
        }),
      ),
    );
  }

  countConfirmed(experienceId: string) {
    return this.prisma.skillClaim.count({ where: { experienceId, confirmed: true } });
  }
}
