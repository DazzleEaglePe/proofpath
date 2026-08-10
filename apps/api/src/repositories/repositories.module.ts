import { Global, Module } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CredentialRepository } from './credential.repository';
import { ExperienceRepository } from './experience.repository';
import { SkillRepository } from './skill.repository';

const REPOSITORIES = [
  ExperienceRepository,
  BatchRepository,
  SkillRepository,
  CredentialRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
