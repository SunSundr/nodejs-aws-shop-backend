import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { proxyResult } from './@proxyResult';
import { formatLog } from './@formatLogs';
import { errorResult } from './@errorResult';
import { dbDocClient } from '../db/client';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { Product, Stock } from '../db/types';
import { HttpMethod } from './@types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  const productId = event.pathParameters?.id;

  if (!productId) {
    return proxyResult(403, HttpMethod.GET, { message: 'Product ID must be provided' });
  }

  try {
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
      dbDocClient.send(
        new GetCommand({
          TableName: STOCKS_TABLE_NAME,
          Key: { product_id: productId },
        }),
      ),
    ]);

    const products = productResult.Items as Product[] | undefined;

    if (!products || products.length === 0) {
      return proxyResult(404, HttpMethod.GET, { message: 'Product not found' });
    }

    const stock = stockResult.Item as Stock | undefined;
    const count = stock?.count ?? 0;

    const productWithCount = {
      ...products[0],
      count,
    };

    return proxyResult(200, HttpMethod.GET, productWithCount);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return errorResult(error, HttpMethod.GET);
  }
};
