export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageURL?: string;
}

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

export const products: Product[] = [
  {
    description: 'Experience the ultimate power in a tiny package',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    price: 24,
    title: 'Super Product',
  },
  {
    description: 'Add a dash of fun and whimsy to your day',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    price: 15,
    title: 'Quirky Product',
  },
  {
    description: 'Unleash your inner groove with this vibrant item',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    price: 23,
    title: 'Funky Product',
  },
  {
    description: 'Elegance and charm wrapped in a stylish bundle',
    id: '7567ec4b-b10c-48c5-9345-fc73348a80a1',
    price: 15,
    title: 'Dandy Product',
  },
  {
    description: 'Your new go-to gadget for everyday convenience',
    id: '7567ec4b-b10c-48c5-9445-fc73c48a80a2',
    price: 23,
    title: 'Nifty Product',
  },
  {
    description: 'Bring a touch of wild and crazy fun into your life',
    id: '7567ec4b-b10c-45c5-9345-fc73c48a80a1',
    price: 15,
    title: 'Zany Product',
  },
];

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
