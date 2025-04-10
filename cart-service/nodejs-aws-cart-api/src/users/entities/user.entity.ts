// import { Cart } from 'src/cart/entities/cart.entity';
// import { Order } from 'src/order/entities/order.entity';
// import { Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Cart } from 'src/cart/entities/cart.entity';
import { Order } from 'src/order/entities/order.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true, unique: true })
  email: string;

  @Column('varchar')
  password?: string;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
