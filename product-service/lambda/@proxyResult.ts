import { APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { getHeaders } from './@headers';

export function proxyResult(
  statusCode: number,
  method: CorsHttpMethod,
  body: unknown,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getHeaders([method]),
    body: JSON.stringify(body),
  };
}
