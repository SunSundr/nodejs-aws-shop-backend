import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../type';
import { User } from 'src/users/entities/user.entity';
import { Cart } from 'src/cart/entities/cart.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Cart)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column('jsonb')
  payment: any;

  @Column('jsonb')
  delivery: any;

  @Column('text', { nullable: true })
  comments: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Open })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
