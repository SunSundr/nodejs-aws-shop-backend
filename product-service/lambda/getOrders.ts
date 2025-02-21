import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { orders } from './@mockData';

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orders),
  };
};
