import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm'
import { User } from './user'

@Entity('provider')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column()
    name: string

  @Column()
    email: string

  @Column()
    password: string

  @OneToMany(() => User, (user) => user.employeeOf, { cascade: true })
    staff: User[]

  @Column()
    description: string

  @CreateDateColumn()
    createdAt: Date

  @UpdateDateColumn()
    updatedAt: Date
}
