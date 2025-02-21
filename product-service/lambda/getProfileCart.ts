import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { cart } from './@mockData';
import { getHeaders } from './@headers';

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.GET]),
    body: JSON.stringify(cart),
  };
};
