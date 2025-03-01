import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  if (!event.body) {
    return proxyResult(400, CorsHttpMethod.PUT, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { id, title } = body;
    const description = body.description || '';
    const price = body.price.toString() || '0';
    const count = body.count.toString() || '0';

    if (!id || !title) {
      return proxyResult(400, CorsHttpMethod.PUT, { message: 'Invalid input data' });
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
            UpdateExpression: 'SET description = :description, price = :price',
            ExpressionAttributeValues: {
              ':description': { S: description },
              ':price': { N: price },
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
              ':count': { N: count },
            },
            ConditionExpression: 'attribute_exists(product_id)',
          },
        },
      ],
    });

    await dbDocClient.send(transactionCommand);

    return proxyResult(200, CorsHttpMethod.PUT, null);
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof Error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return proxyResult(404, CorsHttpMethod.PUT, { message: 'Product not found' });
      }

      if (error.name === 'TransactionCanceledException') {
        return proxyResult(400, CorsHttpMethod.PUT, {
          message: 'Transaction failed. Product not updated.',
        });
      }
    }

    return errorResult(error, CorsHttpMethod.PUT);
  }
};
