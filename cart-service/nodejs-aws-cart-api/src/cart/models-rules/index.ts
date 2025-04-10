export function calculateCartTotal(
  items: {
    productId: string;
    count: 1;
    price?: number;
  }[],
): number {
  return items.length
    ? items.reduce((acc: number, { price, count }) => {
        return (acc += price || 0.99 * count);
      }, 0)
    : 0;
}
