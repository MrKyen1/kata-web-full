import { Uuidv7PrimaryColumn } from 'src/common/decorators/uuidv7.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity('request_logs')
@Index(['requestId'])
@Index(['userId', 'createdAt'])
@Index(['statusCode', 'createdAt'])
@Index(['createdAt'])
export class RequestLog {
  @Uuidv7PrimaryColumn()
  id!: string;

  @Column({ name: 'request_id' })
  requestId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column()
  method!: string;

  @Column({ type: 'text' })
  path!: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode!: number;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs!: number;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'request_body', type: 'jsonb', default: () => "'{}'" })
  requestBody!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  query!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  params!: Record<string, unknown>;

  @Column({ name: 'error_code', type: 'varchar', nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
