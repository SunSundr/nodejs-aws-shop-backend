import { APIGatewayProxyResult } from 'aws-lambda';
import { proxyResult } from './@proxyResult';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';

export function errorResult(error: unknown, method: CorsHttpMethod): APIGatewayProxyResult {
  const statusCode =
    error instanceof Error && 'statusCode' in error ? (error.statusCode as number) : 500;
  return proxyResult(statusCode, method, { message: 'Internal Server Error' });
}
