import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { orders } from './@mockData';
import { proxyResult } from './@proxyResult';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const order = orders.find((o) => o.id === id);

  return order
    ? proxyResult(200, CorsHttpMethod.GET, order)
    : proxyResult(404, CorsHttpMethod.GET, { message: 'Order not found' });
};
