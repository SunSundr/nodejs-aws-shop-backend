import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { HttpMethod } from './@types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  if (!event.body) {
    return proxyResult(400, HttpMethod.POST, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { title, description, price, count } = body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof description !== 'string' ||
      !description.trim() ||
      typeof price !== 'number' ||
      isNaN(price) ||
      typeof count !== 'number' ||
      isNaN(count)
    ) {
      return proxyResult(400, HttpMethod.POST, { message: 'Invalid input data' });
    }

    if (price < 0 || count < 0) {
      return proxyResult(400, HttpMethod.POST, { message: 'Price and count must be non-negative' });
    }

    const imageURL = body.imageURL;

    if (imageURL !== undefined && typeof imageURL !== 'string') {
      return proxyResult(400, HttpMethod.POST, { message: 'Invalid imageURL format' });
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
      ],
    });

    await dbDocClient.send(transactionCommand);

    return proxyResult(201, HttpMethod.POST, {
      id: productId,
      title,
      description,
      price,
      count,
      ...(imageURL && { imageURL }),
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      return proxyResult(400, HttpMethod.POST, {
        message: 'Transaction failed. Product not created.',
      });
    }

    return errorResult(error, HttpMethod.POST);
  }
};
