import { Global, Module } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { ExperienceRepository } from './experience.repository';

@Global()
@Module({
  providers: [ExperienceRepository, BatchRepository],
  exports: [ExperienceRepository, BatchRepository],
})
export class RepositoriesModule {}
