import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import type { SkillSummary } from '../common/skills-summary';
import { CreateExperienceDto } from './dto/create-experience.dto';
import {
  TalentService,
  type ExperienceListItem,
  type TalentPassResponse,
} from './talent.service';

/** Los seis endpoints de 04-IOS-APP.md §3. Cero backend adicional para la app. */
@Controller()
@UseGuards(JwtAuthGuard('talent'))
export class TalentController {
  constructor(private readonly talent: TalentService) {}

  @Get('me/talentpass')
  talentPass(@CurrentUser() user: JwtPayload): Promise<TalentPassResponse> {
    return this.talent.talentPass(user.sub);
  }

  @Get('me/experiences')
  experiences(@CurrentUser() user: JwtPayload): Promise<ExperienceListItem[]> {
    return this.talent.listExperiences(user.sub);
  }

  @Get('me/skills-summary')
  skills(@CurrentUser() user: JwtPayload): Promise<SkillSummary[]> {
    return this.talent.skillsSummary(user.sub);
  }

  /** Programas disponibles, para el selector de "Registrar experiencia". */
  @Get('programs')
  programs() {
    return this.talent.availablePrograms();
  }

  @Get('experiences/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.talent.experienceDetail(id, user.sub);
  }

  /** Crea el borrador. Queda esperando que la ONG lo analice y confirme. */
  @Post('experiences')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExperienceDto) {
    return this.talent.createExperience(user.sub, dto);
  }
}
