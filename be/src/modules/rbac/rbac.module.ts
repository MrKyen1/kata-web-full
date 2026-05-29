import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './controllers/permissions.controller';
import { RolePermissionsController } from './controllers/role-permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { PermissionsService } from './services/permissions.service';
import { RolePermissionsService } from './services/role-permissions.service';
import { RolesService } from './services/roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
  controllers: [
    RolesController,
    PermissionsController,
    RolePermissionsController,
  ],
  providers: [RolesService, PermissionsService, RolePermissionsService],
})
export class RbacModule {}
