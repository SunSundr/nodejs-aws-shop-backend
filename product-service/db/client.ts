import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
//import { DynamoDBDocumentClient, DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dbClient = new DynamoDBClient();
export const dbDocClient = DynamoDBDocumentClient.from(dbClient);
// export const dbDoc = DynamoDBDocument.from(dbClient);
