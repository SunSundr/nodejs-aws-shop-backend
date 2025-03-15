import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../../lib/constants';
import { TransactWriteItemsCommand, TransactWriteItem } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getProductRaw } from './getProduct';

export function deleteProductTransactionItems(
  productId: string,
  category: string,
): TransactWriteItem[] {
  return [
    {
      Delete: {
        TableName: PRODUCTS_TABLE_NAME,
        Key: {
          id: { S: productId },
          category: { S: category },
        },
      },
    },
    {
      Delete: {
        TableName: STOCKS_TABLE_NAME,
        Key: {
          product_id: { S: productId },
        },
      },
    },
  ];
}

export async function deleteProduct(
  dbDocClient: DynamoDBDocumentClient,
  productId: string,
  category?: string,
): Promise<void> {
  if (!category) {
    const product = await getProductRaw(dbDocClient, productId);
    if (!product) {
      throw new Error('Internal error: Product not found');
    }
    category = product.category.S!;
  }

  const transactionCommand = new TransactWriteItemsCommand({
    TransactItems: deleteProductTransactionItems(productId, category),
  });

  await dbDocClient.send(transactionCommand);
}
