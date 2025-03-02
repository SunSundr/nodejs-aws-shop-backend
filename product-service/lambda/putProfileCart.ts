import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { proxyResult } from './@proxyResult';
import { HttpMethod } from './@types';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // event.body is CartItem
  if (!event.body) {
    return proxyResult(400, HttpMethod.PUT, { message: 'Invalid request: body is required' });
  }
  return proxyResult(200, HttpMethod.PUT, null);
};
