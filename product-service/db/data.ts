import { DEFAULT_CATEGORY } from '../lib/constants';
import { Product, ProductCategory, Stock } from './types';
import { cleanString, getReservedId, randomCount } from './utils';

const productsPart: Partial<Product>[] = [
  {
    title: 'Burger Volcano',
    description: `A burger that erupts with flavor! The lava-like sauce flows down the meaty crater,
      while cheesy magma bubbles up. Each bite is an explosion of taste, and the fries?
      They're the lightning bolts in this delicious storm.`,
    imageURL: 'https://i.ibb.co/LhbVDnmR/Burger-Volcano.jpg',
    category: ProductCategory.MainDishes,
    price: 8.99,
  },
  {
    title: 'Galaxy Pizza',
    description: `A pizza that's out of this world! 
      Topped with starry cheese, olive asteroids, and pepperoni planets,
      it's a slice of the cosmos. Warning: may cause uncontrollable cravings for interstellar travel.`,
    imageURL: 'https://i.ibb.co/ZzSb4tw6/Galaxy-Pizza.jpg',
    category: ProductCategory.MainDishes,
    price: 14.99,
  },
  {
    title: 'Pasta Symphony',
    description: `An orchestra in your mouth! 
      Every strand of spaghetti plays a tune, and the bowtie pasta keeps the rhythm. 
      The sauce conducts the flavor, making every bite a masterpiece.`,
    imageURL: 'https://i.ibb.co/Kz64XcJH/Pasta-Symphony.jpg',
    category: ProductCategory.MainDishes,
    price: 12.99,
  },
  {
    title: 'Portal Soup',
    description: `A soup that teleports your taste buds! Dive into a bowl where carrots are islands, 
      noodles are bridges, and the broth is a gateway to flavor dimensions. 
      Spoon not included — it's already floating.`,
    imageURL: 'https://i.ibb.co/xqpjNBFN/Portal-Soup.jpg',
    category: ProductCategory.MainDishes,
    price: 11.5,
  },
  {
    title: 'Universe Cake',
    description: `A cake that contains multitudes! 
      Layers of galaxies, frosting stars, and marzipan planets make this dessert a cosmic delight. 
      The candle on top? It's a supernova waiting to happen.`,
    imageURL: 'https://i.ibb.co/skNGWvK/Universe-Cake.jpg',
    category: ProductCategory.Desserts,
    price: 24.99,
  },
  {
    title: 'Comet Ice Cream',
    description: `Ice cream that's always on the move! Vanilla moons, 
      chocolate planets, and strawberry meteors orbit your cone. 
      One lick, and you're light-years ahead in dessert technology.`,
    imageURL: 'https://i.ibb.co/FbtxqHC4/Comet-Ice-Cream.jpg',
    category: ProductCategory.Desserts,
    price: 7.99,
  },
  {
    title: 'Donut Portal',
    description: `A donut that's a gateway to sweetness! Bite into the glazed ring, 
      and you're transported to a world of sprinkles, frosting rivers, 
      and candy mountains. Warning: re-entry is impossible.`,
    imageURL: 'https://i.ibb.co/Ps2k2gSy/Donut-Portal.jpg',
    category: ProductCategory.Desserts,
    price: 16.99,
  },
  {
    title: 'Magnetic Tea',
    description: `Tea that pulls you in! The leaves are charged with flavor, 
      and the sugar cubes orbit the cup like tiny satellites.
      Stir it, and watch the steam spell out your fortune.`,
    imageURL: 'https://i.ibb.co/BHZcFrN8/Magnetic-Tea.jpg',
    category: ProductCategory.Drinks,
    price: 2.99,
  },
  {
    title: 'Gravity Coffee',
    description: `Coffee that defies physics! The liquid floats in a perfect sphere, 
      swirling with caramel galaxies and cream nebulae. 
      Each sip is a journey through a caffeinated universe.`,
    imageURL: 'https://i.ibb.co/Kc25WTm6/Gravity-Coffee.jpg',
    category: ProductCategory.Drinks,
    price: 5.99,
  },
  {
    title: 'Cola Fireworks',
    description: `A soda that sparkles and pops! Every sip sets off a flavor firework show in your mouth.
      The ice cubes glow like neon lights, and the bubbles? They're tiny rockets.`,
    imageURL: 'https://i.ibb.co/YBm3g4Py/Cola-Fireworks.jpg',
    category: ProductCategory.Drinks,
    price: 4.99,
  },
  {
    title: 'Whirlwind Cocktail',
    description: `A drink that spins your world! Layers of rainbow colors swirl into a tornado of taste. 
      The umbrella? It's just for show — this cocktail floats on its own.`,
    imageURL: 'https://i.ibb.co/Q79cFbc4/Whirlwind-Cocktail.jpg',
    category: ProductCategory.Drinks,
    price: 9.99,
  },
  {
    title: 'Thunder Chips',
    description: `Chips that crackle with power! Each bite creates a mini thunderstorm above your head. 
      The bag is a cloud, and the crunch? It's the sound of flavor lightning.`,
    imageURL: 'https://i.ibb.co/nNZJSSk0/Thunder-Chips.jpg',
    category: ProductCategory.Snacks,
    price: 8.99,
  },
];

export function getProducts(): Product[] {
  return productsPart.map((product, index) => ({
    ...product,
    id: getReservedId(index),
    description: cleanString(String(product.description)),
    count: randomCount(),
    category: DEFAULT_CATEGORY,
  })) as Product[];
}

export const products = getProducts();

export function getProductsWithoutCount(products: Product[]): Product[] {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  return products.map(({ count, ...rest }) => rest) as Product[];
}

export function getStock(products: Product[], count?: number): Stock[] {
  return products.map((product) => ({
    product_id: product.id,
    count: count ?? product.count,
  }));
}
