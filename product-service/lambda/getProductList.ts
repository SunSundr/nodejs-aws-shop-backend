import { APIGatewayProxyResult } from 'aws-lambda';
import { products } from './@mockData';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  };
};
