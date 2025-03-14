import { APIGatewayProxyEventHeaders, APIGatewayProxyResult } from 'aws-lambda';
import { getHeaders } from './@headers';
import { HttpMethod } from './@types';

export function proxyResult(
  statusCode: number,
  method: HttpMethod,
  body: unknown,
  headers: APIGatewayProxyEventHeaders,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getHeaders([method], headers),
    body: JSON.stringify(body),
  };
}
