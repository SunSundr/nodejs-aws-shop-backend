import { Product } from './types';

const randomCount = () => Math.floor(Math.random() * 100) + 1;
// const randomPrice = () => Number((Math.random() * 100 + 1).toFixed(2));

export const products: Product[] = [
  {
    description: 'Experience the ultimate power in a tiny package',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
    price: 24,
    title: 'Super Product',
    count: randomCount(),
  },
  {
    description: 'Add a dash of fun and whimsy to your day',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
    price: 15,
    title: 'Quirky Product',
    count: randomCount(),
  },
  {
    description: 'Unleash your inner groove with this vibrant item',
    id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
    price: 23,
    title: 'Funky Product',
    count: randomCount(),
  },
  {
    description: 'Elegance and charm wrapped in a stylish bundle',
    id: '7567ec4b-b10c-48c5-9345-fc73348a80a1',
    price: 15,
    title: 'Dandy Product',
    count: randomCount(),
  },
  {
    description: 'Your new go-to gadget for everyday convenience',
    id: '7567ec4b-b10c-48c5-9445-fc73c48a80a2',
    price: 23,
    title: 'Nifty Product',
    count: randomCount(),
  },
  {
    description: 'Bring a touch of wild and crazy fun into your life',
    id: '7567ec4b-b10c-45c5-9345-fc73c48a80a1',
    price: 15,
    title: 'Zany Product',
    count: randomCount(),
  },
];
