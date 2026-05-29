import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Audit } from 'src/common/decorators/audit.decorator';
import type { Request } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import type { RequestUser } from 'src/common/types/request-user.type';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Audit({ action: 'auth.login.success', resource: 'auth' })
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() request: Request & { requestId?: string; user?: RequestUser },
  ) {
    return this.authService.login(dto, request);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(dto, request);
  }

  @ApiBearerAuth()
  @Audit({ action: 'auth.logout', resource: 'auth' })
  @Post('logout')
  logout(@CurrentUser() user: RequestUser, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user, dto);
  }

  @ApiBearerAuth()
  @Audit({ action: 'auth.logout_all', resource: 'auth' })
  @Post('logout-all')
  logoutAll(@CurrentUser() user: RequestUser) {
    return this.authService.logoutAll(user);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user);
  }

  @ApiBearerAuth()
  @Patch('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user, dto);
  }

  @ApiBearerAuth()
  @Audit({ action: 'auth.change_password', resource: 'auth' })
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }

  @ApiBearerAuth()
  @Permissions('users.manage')
  @Audit({ action: 'auth.admin_reset_password', resource: 'auth' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
