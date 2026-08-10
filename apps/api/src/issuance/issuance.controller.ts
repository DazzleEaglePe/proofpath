import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import { IssueBatchDto } from './dto/issue-batch.dto';
import { IssuanceService, type IssueBatchResponse } from './issuance.service';

@Controller('org/batches')
@UseGuards(JwtAuthGuard('org'))
export class IssuanceController {
  constructor(private readonly issuance: IssuanceService) {}

  /** Emite N credenciales en una sola transaccion. */
  @Post('issue')
  issue(@CurrentUser() user: JwtPayload, @Body() dto: IssueBatchDto): Promise<IssueBatchResponse> {
    // La organizacion sale del token: nadie puede emitir a nombre de otra.
    return this.issuance.issueBatch(dto.experienceIds, user.sub);
  }
}
