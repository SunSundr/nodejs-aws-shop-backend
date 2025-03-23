import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { proxyResult } from './@proxyResult';
import { detailedMessage, errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { isReservedId } from '../db/utils';
import { HttpMethod } from './@types';
import { updateProduct } from './common/updateProduct';
import { Product } from '../db/types';
import { validateProduct } from './common/validateProduct';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));

  if (!event.body) {
    return proxyResult(400, HttpMethod.PUT, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { product, message } = validateProduct<Product>(body, true);
    if (message || !product) {
      return proxyResult(400, HttpMethod.POST, { message });
    }
    if (isReservedId(product.id)) {
      return proxyResult(403, HttpMethod.DELETE, {
        message: 'Modification of this product is forbidden',
      });
    }

    await updateProduct(dbDocClient, product);
    return proxyResult(200, HttpMethod.POST, product);
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof Error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return proxyResult(404, HttpMethod.PUT, {
          message: 'Product not found',
          ...detailedMessage(error),
        });
      }

      if (error.name === 'TransactionCanceledException') {
        return proxyResult(400, HttpMethod.PUT, {
          message: 'Transaction failed. Product not updated.',
          ...detailedMessage(error),
        });
      }
    }

    return errorResult(error, HttpMethod.PUT);
  }
};
