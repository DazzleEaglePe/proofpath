import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { SkillsService, type SkillView } from './skills.service';

/**
 * Los tres pasos que la ONG recorre en pantalla durante el bloque 0:45–1:30 de
 * la demo: ver lo que propuso la IA, confirmarlo, y dar la experiencia por lista.
 *
 * PENDIENTE: falta el guard de audiencia `org`.
 */
@Controller('experiences/:id')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get('skills')
  list(@Param('id') id: string): Promise<SkillView[]> {
    return this.skills.list(id);
  }

  /** La IA propone. Nada queda confirmado por esta llamada. */
  @Post('ai-extract')
  extract(@Param('id') id: string) {
    return this.skills.extract(id);
  }

  /** El humano confirma, descarta o agrega. */
  @Patch('skills')
  update(@Param('id') id: string, @Body() dto: UpdateSkillsDto): Promise<SkillView[]> {
    return this.skills.update(id, dto);
  }

  /** Cierra la confirmacion: la experiencia queda lista para entrar en un batch. */
  @Post('confirm')
  confirm(@Param('id') id: string) {
    return this.skills.confirmExperience(id);
  }
}
