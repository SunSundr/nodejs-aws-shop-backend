import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orders } from './@mockData';
import { proxyResult } from './@proxyResult';
import { HttpMethod } from './@types';

// Temporary Stub Function
export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return proxyResult(200, HttpMethod.GET, orders);
};
