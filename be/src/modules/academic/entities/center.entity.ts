import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Class } from 'src/modules/academic/entities/class.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('centers')
export class Center extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  address!: string;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  image!: string | null;

  @Column({ name: 'map_embed_url', type: 'varchar', nullable: true })
  mapEmbedUrl!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Class, (_class) => _class.center)
  classes!: Class[];
}
