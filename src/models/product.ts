import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm'
import { User } from './user'

@Entity('products')
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @Column()
    provider: string

  @Column()
    name: string

  @Column()
    price: number

  @Column()
    stock: number

  @Column()
    description: string

  @CreateDateColumn()
    createdAt: Date

  @UpdateDateColumn()
    updatedAt: Date

  // TODO: Images
}

@Entity('comments')
export class Comments extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
    id: string

  @ManyToOne(() => Product)
    product: Product

  @ManyToOne(() => User)
    user: User

  @Column()
    comment: string
}
