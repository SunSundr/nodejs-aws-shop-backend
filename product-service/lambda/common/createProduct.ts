import { TransactWriteItem, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../../lib/constants';
import { ProductWithoutId } from '../../db/types';

export function createProductTransactionItems(
  product: ProductWithoutId,
  productId: string,
): TransactWriteItem[] {
  const { title, description, price, count, imageURL, category } = product;

  return [
    {
      Put: {
        TableName: PRODUCTS_TABLE_NAME,
        Item: {
          id: { S: productId },
          category: { S: category },
          title: { S: title },
          description: { S: description },
          price: { N: price.toString() },
          ...(imageURL && { imageURL: { S: imageURL } }),
        },
      },
    },
    {
      Put: {
        TableName: STOCKS_TABLE_NAME,
        Item: {
          product_id: { S: productId },
          count: { N: count.toString() },
        },
      },
    },
  ];
}

export async function createProduct(
  dbDocClient: DynamoDBDocumentClient | DynamoDBDocument,
  product: ProductWithoutId,
  productId: string,
): Promise<void> {
  const transactionItems = createProductTransactionItems(product, productId);

  const transactionCommand = new TransactWriteItemsCommand({
    TransactItems: transactionItems,
  });

  await dbDocClient.send(transactionCommand);
}
