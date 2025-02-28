import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { dbDocClient } from '../db/client';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { Product, Stock } from '../db/types';
import { formatLog } from './@formatLogs';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  try {
    const [productsResult, stocksResult] = await Promise.all([
      dbDocClient.send(new ScanCommand({ TableName: PRODUCTS_TABLE_NAME })),
      dbDocClient.send(new ScanCommand({ TableName: STOCKS_TABLE_NAME })),
    ]);

    const products = productsResult.Items as Product[];
    const stocks = stocksResult.Items as Stock[];

    const stockMap = new Map<string, number>();
    stocks.forEach((stock) => {
      stockMap.set(stock.product_id, stock.count);
    });

    const productsWithCount = products.map((product) => ({
      ...product,
      count: stockMap.get(product.id) ?? 0,
    }));

    return proxyResult(200, CorsHttpMethod.GET, productsWithCount);
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResult(error);
  }
};
