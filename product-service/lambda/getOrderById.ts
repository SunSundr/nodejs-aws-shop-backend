import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orders } from './@mockData';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const order = orders.find((o) => o.id === id);
  return order
    ? {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      }
    : {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Order not found' }),
      };
};
