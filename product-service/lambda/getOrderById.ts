import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { orders } from './@mockData';
import { getHeaders } from './@headers';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  const order = orders.find((o) => o.id === id);
  return order
    ? {
        statusCode: 200,
        headers: getHeaders([CorsHttpMethod.GET]),
        body: JSON.stringify(order),
      }
    : {
        statusCode: 404,
        headers: getHeaders([CorsHttpMethod.GET]),
        body: JSON.stringify({ message: 'Order not found' }),
      };
};
