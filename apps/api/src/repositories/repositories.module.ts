import { Global, Module } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CredentialRepository } from './credential.repository';
import { ExperienceRepository } from './experience.repository';
import { SkillRepository } from './skill.repository';
import { TalentRepository } from './talent.repository';

const REPOSITORIES = [
  ExperienceRepository,
  BatchRepository,
  SkillRepository,
  CredentialRepository,
  TalentRepository,
];

@Global()
@Module({
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class RepositoriesModule {}
