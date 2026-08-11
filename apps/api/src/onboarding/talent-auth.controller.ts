import { Body, Controller, Post } from '@nestjs/common';
import {
  TalentForgotPasswordDto,
  TalentLoginDto,
  TalentRegisterDto,
  TalentResetPasswordDto,
  TalentVerifyEmailDto,
} from './dto/talent-auth.dto';
import {
  TalentAuthService,
  type AuthChallengeResponse,
  type AuthMessageResponse,
  type TalentSessionResponse,
} from './talent-auth.service';

@Controller('auth/talent')
export class TalentAuthController {
  constructor(private readonly auth: TalentAuthService) {}

  @Post('register')
  register(@Body() dto: TalentRegisterDto): Promise<AuthChallengeResponse> {
    return this.auth.register(dto);
  }

  @Post('verify-email')
  verifyEmail(
    @Body() dto: TalentVerifyEmailDto,
  ): Promise<TalentSessionResponse> {
    return this.auth.verifyEmail(dto.challengeId, dto.code);
  }

  @Post('login')
  login(@Body() dto: TalentLoginDto): Promise<TalentSessionResponse> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() dto: TalentForgotPasswordDto,
  ): Promise<AuthChallengeResponse> {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(
    @Body() dto: TalentResetPasswordDto,
  ): Promise<AuthMessageResponse> {
    return this.auth.resetPassword(dto.challengeId, dto.code, dto.newPassword);
  }
}
