import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AttributeValue, QueryCommand as QueryCommandClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../../lib/constants';
import { Product, ProductWithoutCount, Stock } from '../../db/types';
import { getItem } from './getItem';

export async function getProduct(
  dbDocClient: DynamoDBDocumentClient,
  productId: string,
  fullInfo: boolean = true,
): Promise<Product | ProductWithoutCount | undefined> {
  const [productResult, stockResult] = await Promise.all([
    dbDocClient.send(
      new QueryCommand({
        TableName: PRODUCTS_TABLE_NAME,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': productId,
        },
      }),
    ),
    fullInfo
      ? dbDocClient.send(
          new GetCommand({
            TableName: STOCKS_TABLE_NAME,
            Key: { product_id: productId },
          }),
        )
      : Promise.resolve(null),
  ]);
  const product = getItem<ProductWithoutCount>(productResult.Items);
  if (!product) {
    return undefined;
  }

  if (!fullInfo) {
    return product;
  }

  const stock: Stock = stockResult?.Item as Stock;
  const count = stock?.count;

  return {
    ...product,
    count,
  };
}

export async function getProductRaw(
  dbDocClient: DynamoDBDocumentClient,
  productId: string,
): Promise<Record<string, AttributeValue> | undefined> {
  const queryCommand = new QueryCommandClient({
    TableName: PRODUCTS_TABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': { S: productId },
    },
  });

  const queryResult = await dbDocClient.send(queryCommand);
  return getItem(queryResult.Items);
}
