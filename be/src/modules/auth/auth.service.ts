import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';
import { Request } from 'express';
import type { StringValue } from 'ms';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { RequestUser } from 'src/common/types/request-user.type';
import { AuditLogsService } from 'src/modules/observability/services/audit-logs.service';
import { User } from 'src/modules/users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { AuthRefreshToken } from './entities/auth-refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthRefreshToken)
    private readonly refreshTokenRepository: Repository<AuthRefreshToken>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(
    dto: LoginDto,
    request: Request & { requestId?: string; user?: RequestUser },
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.hashedPassword')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.is_active = true')
      .andWhere('user.code = :identifier', { identifier: dto.identifier })
      .getOne();

    if (!user) {
      await this.auditFailedLogin(dto.identifier, request, 'user_not_found');
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditFailedLogin(dto.identifier, request, 'user_locked');
      throw new UnauthorizedException('Người dùng đang bị khóa tạm thời');
    }

    const validPassword = await argon2.verify(
      user.hashedPassword,
      dto.password,
    );
    if (!validPassword) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await this.userRepository.save(user);
      await this.auditFailedLogin(dto.identifier, request, 'invalid_password');
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { data: await this.buildAuthResponse(user.id, request) };
  }

  async refresh(dto: RefreshTokenDto, request: Request) {
    const payload = await this.jwtService
      .verifyAsync<{ sub: string; tokenType: string }>(dto.refreshToken, {
        secret: this.refreshSecret,
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      });

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Loại token không hợp lệ');
    }

    const tokens = await this.refreshTokenRepository.find({
      where: {
        userId: payload.sub,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    const matchedToken = await this.findMatchingRefreshToken(
      tokens,
      dto.refreshToken,
    );
    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    matchedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(matchedToken);

    return { data: await this.buildAuthResponse(payload.sub, request) };
  }

  async logout(user: RequestUser, dto: RefreshTokenDto) {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        userId: user.id,
        revokedAt: IsNull(),
      },
    });
    const matchedToken = await this.findMatchingRefreshToken(
      tokens,
      dto.refreshToken,
    );
    if (matchedToken) {
      matchedToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(matchedToken);
    }
    return { data: { revoked: Boolean(matchedToken) } };
  }

  async logoutAll(user: RequestUser) {
    await this.refreshTokenRepository.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return { data: { revoked: true } };
  }

  async me(user: RequestUser) {
    const entity = await this.userRepository.findOne({
      where: { id: user.id, isActive: true },
      relations: {
        role: {
          permissions: {
            permission: true,
          },
        },
      },
    });
    if (!entity) throw new NotFoundException('Không tìm thấy người dùng');
    return { data: this.mapAuthUser(entity) };
  }

  async updateMe(user: RequestUser, dto: UpdateMeDto) {
    const entity = await this.userRepository.findOne({
      where: { id: user.id, isActive: true },
    });
    if (!entity) throw new NotFoundException('Không tìm thấy người dùng');
    Object.assign(entity, dto);
    return { data: this.sanitizeUser(await this.userRepository.save(entity)) };
  }

  async changePassword(user: RequestUser, dto: ChangePasswordDto) {
    const entity = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.hashedPassword')
      .where('user.id = :id', { id: user.id })
      .andWhere('user.is_active = true')
      .getOne();
    if (!entity) throw new NotFoundException('Không tìm thấy người dùng');

    const validPassword = await argon2.verify(
      entity.hashedPassword,
      dto.currentPassword,
    );
    if (!validPassword)
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');

    entity.hashedPassword = await argon2.hash(dto.newPassword);
    entity.passwordChangedAt = new Date();
    await this.userRepository.save(entity);
    await this.logoutAll(user);

    return { data: { changed: true } };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.hashedPassword')
      .where('user.is_active = true')
      .andWhere('(user.code = :identifier OR user.id::text = :identifier)', {
        identifier: dto.identifier,
      })
      .getOne();

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const password = this.generateTemporaryPassword();
    user.hashedPassword = await argon2.hash(password);
    user.passwordChangedAt = new Date();
    await this.userRepository.save(user);
    await this.refreshTokenRepository.update(
      { userId: user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return {
      data: {
        reset: true,
        password,
        user: {
          id: user.id,
          code: user.code,
        },
      },
    };
  }

  private async buildAuthResponse(userId: string, request: Request) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: {
        role: {
          permissions: {
            permission: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng');

    const permissions = (user.role.permissions ?? []).map(
      (item) => item.permission.code,
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        roleCode: user.role.code,
        permissions,
        tokenType: 'access',
      },
      {
        secret: this.accessSecret,
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as StringValue,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, tokenType: 'refresh' },
      {
        secret: this.refreshSecret,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as StringValue,
      },
    );

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      }),
    );

    return {
      user: this.mapAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async findMatchingRefreshToken(
    tokens: AuthRefreshToken[],
    rawToken: string,
  ) {
    for (const token of tokens) {
      if (await argon2.verify(token.tokenHash, rawToken)) return token;
    }
    return undefined;
  }

  private generateTemporaryPassword(length = 14) {
    const groups = [
      'ABCDEFGHJKLMNPQRSTUVWXYZ',
      'abcdefghijkmnopqrstuvwxyz',
      '23456789',
    ];
    const alphabet = groups.join('');
    const chars = [
      ...groups.map((group) => group[randomInt(group.length)]),
      ...Array.from({ length: length - groups.length }, () => {
        return alphabet[randomInt(alphabet.length)];
      }),
    ];

    for (let index = chars.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
    }

    return chars.join('');
  }

  private sanitizeUser(user: User) {
    const safeUser = { ...user } as Partial<User>;
    delete safeUser.hashedPassword;
    return safeUser;
  }

  private mapAuthUser(user: User) {
    const safeUser = this.sanitizeUser(user) as Record<string, unknown>;
    delete safeUser.role;
    const permissions = (user.role?.permissions ?? []).map(
      (item) => item.permission.code,
    );

    return {
      ...safeUser,
      role: user.role
        ? {
            id: user.role.id,
            code: user.role.code,
            name: user.role.name,
            permissions,
          }
        : undefined,
    };
  }

  private async auditFailedLogin(
    identifier: string,
    request: Request & { requestId?: string; user?: RequestUser },
    reason: string,
  ) {
    await this.auditLogsService.createFromRequest(request, {
      action: 'auth.login.failed',
      resource: 'auth',
      payload: { identifier, reason },
    });
  }

  private get accessSecret() {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  }

  private get refreshSecret() {
    return process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
  }

  private get refreshTtlMs() {
    return Number(process.env.JWT_REFRESH_TTL_MS ?? 7 * 24 * 60 * 60 * 1000);
  }
}
