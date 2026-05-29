import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Question } from './question.entity';

@Entity('topics')
@Unique(['parentId', 'code'])
export class Topic extends BaseEntity {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Topic, (topic) => topic.children, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Topic | null;

  @OneToMany(() => Topic, (topic) => topic.parent)
  children!: Topic[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Question, (question) => question.topic)
  questions!: Question[];
}
