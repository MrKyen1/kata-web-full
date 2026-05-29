import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { RolePermission } from 'src/modules/rbac/entities/role-permission.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  roles!: RolePermission[];
}
