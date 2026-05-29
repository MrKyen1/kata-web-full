import { IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @IsUUID()
  roleId!: string;

  @IsUUID()
  permissionId!: string;
}
