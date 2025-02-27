import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { orders } from './@mockData';
import { proxyResult } from './@proxyResult';

// Temporary Stub Function
export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return proxyResult(200, CorsHttpMethod.GET, orders);
};
