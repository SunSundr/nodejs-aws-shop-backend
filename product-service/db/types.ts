export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
  imageURL?: string;
}

export interface Stock {
  product_id: string;
  count: number;
}
