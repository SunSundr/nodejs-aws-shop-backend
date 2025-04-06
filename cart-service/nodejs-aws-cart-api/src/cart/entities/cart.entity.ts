import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { User } from 'src/users/entities/user.entity';
import { CartStatuses } from '../models';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @ManyToOne(() => User, (user) => user.carts)
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: CartStatuses,
    default: CartStatuses.OPEN,
  })
  status: CartStatuses;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
