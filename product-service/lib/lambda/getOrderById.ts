import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orders } from './@mockData';
import { proxyResult } from './@proxyResult';
import { HttpMethod } from './@types';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const order = orders.find((o) => o.id === id);

  return order
    ? proxyResult(200, HttpMethod.GET, order)
    : proxyResult(404, HttpMethod.GET, { message: 'Order not found' });
};
