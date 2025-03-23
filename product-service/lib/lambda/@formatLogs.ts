import { APIGatewayProxyEvent } from 'aws-lambda';

export function formatLog(method: string, path: string, event?: APIGatewayProxyEvent) {
  const eventInfo = event ? `\nevent: ${JSON.stringify(event)}` : '';
  return `[INCOMING] ${method} ${path} ${eventInfo}`;
}
