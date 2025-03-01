import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { proxyResult } from './@proxyResult';
import { formatLog } from './@formatLogs';
import { errorResult } from './@errorResult';
import { dbDocClient } from '../db/client';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { Product, Stock } from '../db/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  const productId = event.pathParameters?.id;

  if (!productId) {
    return proxyResult(403, CorsHttpMethod.GET, { message: 'Product ID must be provided' });
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
      return proxyResult(404, CorsHttpMethod.GET, { message: 'Product not found' });
    }

    const stock = stockResult.Item as Stock | undefined;

    const productWithCount = {
      ...products[0],
      count: stock?.count ?? 0,
    };

    return proxyResult(200, CorsHttpMethod.GET, productWithCount);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return errorResult(error, CorsHttpMethod.GET);
  }
};
