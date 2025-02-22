import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { getHeaders } from './@headers';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // event.body is CartItem
  if (!event.body) {
    return {
      statusCode: 400,
      headers: getHeaders([CorsHttpMethod.PUT]),
      body: JSON.stringify({ message: 'Invalid request: body is required' }),
    };
  }
  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.PUT]),
    body: JSON.stringify(null),
  };
};
