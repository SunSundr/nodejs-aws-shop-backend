import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { proxyResult } from './@proxyResult';
import { products } from '../db/data';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return proxyResult(403, CorsHttpMethod.GET, { message: 'ID must be provided' });
  }

  const product = products.find((item) => item.id === productId);

  if (!product) {
    return proxyResult(404, CorsHttpMethod.GET, { message: 'Product not found' });
  }

  return proxyResult(200, CorsHttpMethod.GET, product);
};
