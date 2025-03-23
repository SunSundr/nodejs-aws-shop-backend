import { DEFAULT_CATEGORY } from '../../lib/constants';

export interface Product {
  id: string;
  category: string;
  title: string;
  description: string;
  price: number;
  count: number;
  imageURL?: string | null;
}

export type ProductWithoutId = Omit<Product, 'id'>;
export type ProductWithoutCount = Omit<Product, 'count'>;

export interface Stock {
  product_id: string;
  count: number;
}

export enum ProductCategory {
  MainDishes = 'Main Dishes',
  Desserts = 'Desserts',
  Drinks = 'Drinks',
  Snacks = 'Snacks',
  Default = DEFAULT_CATEGORY,
}

export interface ValidateResult<T> {
  product?: T;
  message?: string;
}
