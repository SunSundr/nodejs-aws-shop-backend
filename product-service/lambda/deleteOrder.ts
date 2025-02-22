import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { getHeaders } from './@headers';

// Temporary Stub Function
export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.DELETE]),
    body: JSON.stringify(null),
  };
};
