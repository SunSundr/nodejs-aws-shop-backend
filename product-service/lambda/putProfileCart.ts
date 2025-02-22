import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { proxyResult } from './@proxyResult';

// Temporary Stub Function
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // event.body is CartItem
  if (!event.body) {
    return proxyResult(400, CorsHttpMethod.PUT, { message: 'Invalid request: body is required' });
  }
  return proxyResult(200, CorsHttpMethod.PUT, null);
};
