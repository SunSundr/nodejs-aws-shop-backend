import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { isReservedId } from '../db/utils';
import { HttpMethod } from './@types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  if (!event.body) {
    return proxyResult(400, HttpMethod.PUT, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { id, title, description, price, count } = body;

    if (
      typeof id !== 'string' ||
      !id.trim() ||
      typeof title !== 'string' ||
      !title.trim() ||
      typeof description !== 'string' ||
      !description.trim() ||
      typeof price !== 'number' ||
      isNaN(price) ||
      typeof count !== 'number' ||
      isNaN(count)
    ) {
      return proxyResult(400, HttpMethod.PUT, { message: 'Invalid input data' });
    }

    if (price < 0 || count < 0) {
      return proxyResult(400, HttpMethod.PUT, { message: 'Price and count must be non-negative' });
    }

    if (isReservedId(id)) {
      return proxyResult(403, HttpMethod.DELETE, {
        message: 'Modification of this product is forbidden',
      });
    }

    const imageURL = body.imageURL;

    if (imageURL !== undefined && typeof imageURL !== 'string') {
      return proxyResult(400, HttpMethod.POST, { message: 'Invalid imageURL format' });
    }

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Update: {
            TableName: PRODUCTS_TABLE_NAME,
            Key: {
              id: { S: id },
              title: { S: title },
            },
            UpdateExpression:
              imageURL === ''
                ? 'REMOVE imageURL SET description = :description, price = :price'
                : imageURL !== undefined
                  ? 'SET description = :description, price = :price, imageURL = :imageURL'
                  : 'SET description = :description, price = :price',
            ExpressionAttributeValues: {
              ':description': { S: description },
              ':price': { N: price.toString() },
              ...(imageURL !== '' && imageURL !== undefined && { ':imageURL': { S: imageURL } }),
            },
            ConditionExpression: 'attribute_exists(id) AND attribute_exists(title)',
          },
        },
        {
          Update: {
            TableName: STOCKS_TABLE_NAME,
            Key: {
              product_id: { S: id },
            },
            UpdateExpression: 'SET #count = :count', // count is a reserved keyword
            ExpressionAttributeNames: {
              '#count': 'count',
            },
            ExpressionAttributeValues: {
              ':count': { N: count.toString() },
            },
            ConditionExpression: 'attribute_exists(product_id)',
          },
        },
      ],
    });

    await dbDocClient.send(transactionCommand);

    //return proxyResult(200, HttpMethod.PUT, null);
    return proxyResult(200, HttpMethod.POST, {
      id,
      title,
      description,
      price,
      count,
      ...(imageURL && { imageURL }),
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof Error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return proxyResult(404, HttpMethod.PUT, { message: 'Product not found' });
      }

      if (error.name === 'TransactionCanceledException') {
        return proxyResult(400, HttpMethod.PUT, {
          message: 'Transaction failed. Product not updated.',
        });
      }
    }

    return errorResult(error, HttpMethod.PUT);
  }
};
