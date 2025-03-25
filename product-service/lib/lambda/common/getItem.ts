import { AttributeValue } from '@aws-sdk/client-dynamodb';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function getItem<T = Record<string, AttributeValue>>(items: any[] | undefined) {
  if (!items) {
    throw new Error('Internal error: Invalid response from DynamoDB');
  }

  if (items.length === 0) {
    return undefined;
  }

  if (items.length > 1) {
    throw new Error('Internal error: DynamoDB table structure is Invalid');
  }

  return items[0] as T;
}
