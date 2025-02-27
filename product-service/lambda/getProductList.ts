import { APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { products } from './@mockData';
import { proxyResult } from './@proxyResult';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return proxyResult(200, CorsHttpMethod.GET, products);
};
