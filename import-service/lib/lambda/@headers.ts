import { APIGatewayProxyEventHeaders } from 'aws-lambda';
import { ALLOWED_ORIGINS } from '../constants';

export function getHeaders(
  methods: string[] = [],
  headers: APIGatewayProxyEventHeaders | undefined,
) {
  const origin = headers ? headers['origin'] || headers['Origin'] : '*';
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Methods': methods.length
      ? methods.join(', ')
      : 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
