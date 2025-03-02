import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { randomUUID } from 'crypto';
import { proxyResult } from './@proxyResult';
import { formatLog } from './@formatLogs';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { dbDocClient } from '../db/client';

import { errorResult } from './@errorResult';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  if (!event.body) {
    return proxyResult(400, CorsHttpMethod.POST, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { count, price, description, title } = body;

    if (
      count === undefined ||
      price === undefined ||
      description === undefined ||
      !title ||
      count < 0 ||
      price < 0
    ) {
      return proxyResult(400, CorsHttpMethod.POST, { message: 'Invalid input data' });
    }

    const productId = randomUUID();

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: PRODUCTS_TABLE_NAME,
            Item: {
              id: { S: productId },
              title: { S: title },
              description: { S: description || '' },
              price: { N: price.toString() },
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
      ],
    });

    await dbDocClient.send(transactionCommand);

    return proxyResult(201, CorsHttpMethod.POST, {
      id: productId,
      title,
      description,
      price,
      count,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      return proxyResult(400, CorsHttpMethod.POST, {
        message: 'Transaction failed. Product not created.',
      });
    }

    return errorResult(error, CorsHttpMethod.POST);
  }
};
