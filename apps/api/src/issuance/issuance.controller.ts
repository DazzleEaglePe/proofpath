import { Body, Controller, Post } from '@nestjs/common';
import { IssueBatchDto } from './dto/issue-batch.dto';
import { IssuanceService, type IssueBatchResponse } from './issuance.service';

@Controller('org/batches')
export class IssuanceController {
  constructor(private readonly issuance: IssuanceService) {}

  /**
   * Emite N credenciales en una sola transaccion.
   *
   * PENDIENTE: falta el guard de audiencia `org`. Mientras no exista, este
   * endpoint no debe exponerse fuera de localhost.
   */
  @Post('issue')
  issue(@Body() dto: IssueBatchDto): Promise<IssueBatchResponse> {
    return this.issuance.issueBatch(dto.experienceIds);
  }
}
