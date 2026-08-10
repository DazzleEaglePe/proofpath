import { Module } from '@nestjs/common';
import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { RevocationController } from './revocation.controller';
import { RevocationService } from './revocation.service';

@Module({
  controllers: [IssuanceController, RevocationController],
  providers: [IssuanceService, RevocationService],
  exports: [IssuanceService, RevocationService],
})
export class IssuanceModule {}
