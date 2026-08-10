import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt.guard';
import { OrgService, type OrgProgramView } from './org.service';

@Controller('org')
@UseGuards(JwtAuthGuard('org'))
class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.org.me(user.sub);
  }

  /** Los programas salen del token: una ONG solo ve los suyos. */
  @Get('programs')
  programs(@CurrentUser() user: JwtPayload): Promise<OrgProgramView[]> {
    return this.org.programs(user.sub);
  }
}

@Module({
  controllers: [OrgController],
  providers: [OrgService],
})
export class OrgModule {}
