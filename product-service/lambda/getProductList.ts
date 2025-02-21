import { APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { products } from './@mockData';
import { getHeaders } from './@headers';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: getHeaders([CorsHttpMethod.GET]),
    body: JSON.stringify(products),
  };
};
