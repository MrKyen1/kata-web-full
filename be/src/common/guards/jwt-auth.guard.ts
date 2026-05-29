import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../types/request-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Access token là bắt buộc');

    const payload = await this.jwtService
      .verifyAsync<{ sub: string; tokenType: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      })
      .catch(() => {
        throw new UnauthorizedException('Access token không hợp lệ');
      });

    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Loại token không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: {
        role: {
          permissions: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Không tìm thấy người dùng hoặc người dùng đã ngừng hoạt động',
      );
    }

    request.user = {
      id: user.id,
      code: user.code,
      phone: user.phone,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.role.code,
      permissions: (user.role.permissions ?? []).map(
        (item) => item.permission.code,
      ),
    };

    return true;
  }

  private extractToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
