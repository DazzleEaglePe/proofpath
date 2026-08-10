import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { SkillsService, type SkillView } from './skills.service';

/**
 * Los tres pasos que la ONG recorre en pantalla durante el bloque 0:45–1:30 de
 * la demo: ver lo que propuso la IA, confirmarlo, y dar la experiencia por lista.
 */
@Controller('experiences/:id')
@UseGuards(JwtAuthGuard('org'))
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get('skills')
  list(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<SkillView[]> {
    return this.skills.list(id, user.sub);
  }

  /** La IA propone. Nada queda confirmado por esta llamada. */
  @Post('ai-extract')
  extract(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.skills.extract(id, user.sub);
  }

  /** El humano confirma, descarta o agrega. */
  @Patch('skills')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSkillsDto,
  ): Promise<SkillView[]> {
    return this.skills.update(id, dto, user.sub);
  }

  /** Cierra la confirmacion: la experiencia queda lista para entrar en un batch. */
  @Post('confirm')
  confirm(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.skills.confirmExperience(id, user.sub);
  }
}
