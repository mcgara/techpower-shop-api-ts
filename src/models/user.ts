import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm'
import { Provider } from './provider'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column()
    username: string

  @Column()
    email: string

  @Column()
    password: string

  @Column()
    name: string

  @Column()
    lastName: string

  @Column()
    birthDate: Date

  @Column()
    direction: string

  @ManyToOne(() => Provider, (provider) => provider.staff, { onDelete: 'SET NULL' })
    employeeOf: Provider

  @CreateDateColumn()
    createdAt: Date

  @UpdateDateColumn()
    updatedAt: Date
}
