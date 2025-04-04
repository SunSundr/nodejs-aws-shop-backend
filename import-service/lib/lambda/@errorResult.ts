import { APIGatewayProxyEventHeaders, APIGatewayProxyResult } from 'aws-lambda';
import { proxyResult } from './@proxyResult';
import { HttpMethod } from './@types';

export function errorResult(
  error: unknown,
  method: HttpMethod,
  headers: APIGatewayProxyEventHeaders,
): APIGatewayProxyResult {
  const statusCode =
    error instanceof Error && 'statusCode' in error ? (error.statusCode as number) : 500;
  return proxyResult(statusCode, method, { message: 'Internal Server Error' }, headers);
}
