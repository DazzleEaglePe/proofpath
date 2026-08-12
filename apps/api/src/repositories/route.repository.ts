import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rutas abiertas con sus hitos en orden. Las cerradas no se muestran: una
   * convocatoria vencida no es una meta, es ruido.
   */
  listOpenWithMilestones() {
    return this.prisma.route.findMany({
      where: { isOpen: true },
      include: {
        organization: true,
        milestones: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ closesAt: 'asc' }, { title: 'asc' }],
    });
  }

  /**
   * Experiencias del talento que todavia NO son credencial. No cumplen ningun
   * hito: solo alimentan el estado "en revision", para que la ruta muestre que
   * algo esta en camino en vez de parecer estancada.
   */
  findPendingExperiences(talentProfileId: string) {
    return this.prisma.experience.findMany({
      where: { talentProfileId, status: { not: 'ISSUED' } },
      include: {
        program: true,
        skillClaims: { where: { confirmed: true } },
      },
    });
  }
}
