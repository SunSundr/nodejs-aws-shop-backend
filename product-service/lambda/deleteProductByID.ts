import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { TransactWriteItemsCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { isReservedId } from '../db/utils';
import { HttpMethod } from './@types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  const productId = event.pathParameters?.id;

  if (!productId) {
    return proxyResult(400, HttpMethod.DELETE, { message: 'Product ID must be provided' });
  }

  if (isReservedId(productId)) {
    return proxyResult(403, HttpMethod.DELETE, {
      message: 'Deletion of this product is forbidden',
    });
  }

  try {
    const queryCommand = new QueryCommand({
      TableName: PRODUCTS_TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': { S: productId },
      },
    });

    const queryResult = await dbDocClient.send(queryCommand);
    const products = queryResult.Items;

    if (!products || products.length === 0) {
      return proxyResult(404, HttpMethod.DELETE, { message: 'Product not found' });
    }

    const product = products[0];
    const title = product.title.S!;

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Delete: {
            TableName: PRODUCTS_TABLE_NAME,
            Key: {
              id: { S: productId },
              title: { S: title }, // sortKey
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
      ],
    });

    await dbDocClient.send(transactionCommand);

    return proxyResult(200, HttpMethod.DELETE, { message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error instanceof Error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return proxyResult(404, HttpMethod.DELETE, { message: 'Product not found' });
      }

      if (error.name === 'TransactionCanceledException') {
        return proxyResult(400, HttpMethod.DELETE, {
          message: 'Transaction failed. Product not deleted.',
        });
      }
    }

    return errorResult(error, HttpMethod.DELETE);
  }
};
