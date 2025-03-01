import { Product } from './types';

const randomCount = () => Math.floor(Math.random() * 100) + 1;
// const randomPrice = () => Number((Math.random() * 100 + 1).toFixed(2));

export const products: Product[] = [
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    title: 'Super Product',
    description: 'Experience the ultimate power in a tiny package',
    price: 24,
    count: randomCount(),
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    title: 'Quirky Product',
    description: 'Add a dash of fun and whimsy to your day',
    price: 15,
    count: randomCount(),
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    title: 'Funky Product',
    description: 'Unleash your inner groove with this vibrant item',
    price: 23,
    count: randomCount(),
  },
  {
    id: '7567ec4b-b10c-48c5-9345-fc73348a80a1',
    title: 'Dandy Product',
    description: 'Elegance and charm wrapped in a stylish bundle',
    price: 15,
    count: randomCount(),
  },
  {
    id: '7567ec4b-b10c-48c5-9445-fc73c48a80a2',
    title: 'Nifty Product',
    description: 'Your new go-to gadget for everyday convenience',
    price: 23,
    count: randomCount(),
  },
  {
    id: '7567ec4b-b10c-45c5-9345-fc73c48a80a1',
    title: 'Zany Product',
    description: 'Bring a touch of wild and crazy fun into your life',
    price: 15,
    count: randomCount(),
  },
];
