import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dbClient = new DynamoDBClient();
export const dbDocClient = DynamoDBDocumentClient.from(dbClient);
