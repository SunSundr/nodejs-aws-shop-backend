import { APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { proxyResult } from './@proxyResult';
import { products } from '../db/data';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return proxyResult(200, CorsHttpMethod.GET, products);
};
