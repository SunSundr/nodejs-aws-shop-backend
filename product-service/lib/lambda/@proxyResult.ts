import { APIGatewayProxyResult } from 'aws-lambda';
import { getHeaders } from './@headers';
import { HttpMethod } from './@types';

export function proxyResult(
  statusCode: number,
  method: HttpMethod,
  body: unknown,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getHeaders([method]),
    body: JSON.stringify(body),
  };
}
