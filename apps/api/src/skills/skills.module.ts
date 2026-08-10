import { Logger, Module } from '@nestjs/common';
import { MockSkillExtractor } from './mock-skill-extractor';
import { OpenAiSkillExtractor } from './openai-skill-extractor';
import { SKILL_EXTRACTOR, type SkillExtractor } from './skill-extractor';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  controllers: [SkillsController],
  providers: [
    SkillsService,
    {
      provide: SKILL_EXTRACTOR,
      useFactory: (): SkillExtractor => {
        const modo = (process.env.SKILL_EXTRACTOR ?? 'OPENAI').toUpperCase();
        const log = new Logger('SkillsModule');

        if (modo === 'MOCK') return new MockSkillExtractor();

        try {
          return new OpenAiSkillExtractor();
        } catch (e) {
          // Sin API key el backend no debe caerse: se degrada al mock y se avisa.
          // Perder la extraccion no puede impedir arrancar el resto del sistema.
          log.warn(`${(e as Error).message} Se usa el extractor MOCK.`);
          return new MockSkillExtractor();
        }
      },
    },
  ],
  exports: [SkillsService],
})
export class SkillsModule {}
