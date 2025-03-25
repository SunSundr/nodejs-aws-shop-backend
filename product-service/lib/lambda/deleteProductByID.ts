import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { proxyResult } from './@proxyResult';
import { detailedMessage, errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { isReservedId } from '../db/utils';
import { HttpMethod } from './@types';
import { deleteProduct } from './common/deleteProduct';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  //const claims = event.requestContext?.authorizer?.claims;
  // if (!claims) {
  //   return proxyResult(401, HttpMethod.DELETE, { message: 'Unauthorized' });
  // }

  const productId = event.pathParameters?.id;
  const category = event.queryStringParameters?.category;

  if (!productId) {
    return proxyResult(400, HttpMethod.DELETE, { message: 'Product ID must be provided' });
  }

  if (isReservedId(productId)) {
    return proxyResult(403, HttpMethod.DELETE, {
      message: 'Deletion of this product is forbidden',
    });
  }

  try {
    await deleteProduct(dbDocClient, productId, category);
    return proxyResult(200, HttpMethod.DELETE, { message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error instanceof Error) {
      if (
        error.name === 'ConditionalCheckFailedException' ||
        error.name === 'CustomTransactionCanceled'
      ) {
        return proxyResult(404, HttpMethod.DELETE, {
          message: 'Product not found',
          ...detailedMessage(error),
        });
      }

      if (error.name === 'TransactionCanceledException') {
        return proxyResult(400, HttpMethod.DELETE, {
          message: 'Transaction failed. Product not deleted.',
          ...detailedMessage(error),
        });
      }
    }

    return errorResult(error, HttpMethod.DELETE);
  }
};
