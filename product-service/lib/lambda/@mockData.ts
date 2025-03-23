import { products } from '../db/data';
import { Product } from '../db/types';

export interface CartItem {
  product: Product;
  count: number;
}

export enum OrderStatus {
  Open = 'OPEN',
  Approved = 'APPROVED',
  Confirmed = 'CONFIRMED',
  Sent = 'SENT',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export interface Order {
  id: string;
  items: {
    count: number;
    productId: string;
  }[];
  address: {
    firstName: string;
    lastName: string;
    address: string;
    comment: string;
  };
  statusHistory: {
    status: NonNullable<OrderStatus | undefined>;
    comment: string;
    timestamp: number;
  }[];
}

export const cart: CartItem[] = [
  {
    product: products[0],
    count: 2,
  },
  {
    product: products[5],
    count: 5,
  },
];

export const orders: Order[] = [
  {
    id: '1',
    address: {
      address: 'some address',
      firstName: 'Name',
      lastName: 'Surname',
      comment: '',
    },
    items: [
      { productId: products[0].id ?? 'error', count: 2 },
      { productId: products[5].id ?? 'error', count: 5 },
    ],
    statusHistory: [{ status: OrderStatus.Open, timestamp: Date.now(), comment: 'New order' }],
  },
  {
    id: '2',
    address: {
      address: 'another address',
      firstName: 'John',
      lastName: 'Doe',
      comment: 'Ship fast!',
    },
    items: [{ productId: products[0].id ?? 'error', count: 3 }],
    statusHistory: [
      {
        status: OrderStatus.Sent,
        timestamp: Date.now(),
        comment: 'Fancy order',
      },
    ],
  },
];
