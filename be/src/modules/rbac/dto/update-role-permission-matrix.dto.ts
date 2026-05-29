import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RolePermissionAssignmentDto {
  @IsUUID()
  roleId!: string;

  @IsUUID()
  permissionId!: string;
}

export class UpdateRolePermissionMatrixDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  roleIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  permissionIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionAssignmentDto)
  assignments!: RolePermissionAssignmentDto[];
}
