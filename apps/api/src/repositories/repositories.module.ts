import { Global, Module } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { ExperienceRepository } from './experience.repository';
import { SkillRepository } from './skill.repository';

@Global()
@Module({
  providers: [ExperienceRepository, BatchRepository, SkillRepository],
  exports: [ExperienceRepository, BatchRepository, SkillRepository],
})
export class RepositoriesModule {}
