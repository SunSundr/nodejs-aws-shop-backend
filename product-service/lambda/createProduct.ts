import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { proxyResult } from './@proxyResult';
import { detailedMessage, errorResult } from './@errorResult';
import { formatLog } from './@formatLogs';
import { dbDocClient } from '../db/client';
import { HttpMethod } from './@types';
import { createProduct } from './common/createProduct';
import { ProductWithoutId } from '../db/types';
import { validateProduct } from './common/validateProduct';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(formatLog(event.httpMethod, event.path, event));
  if (!event.body) {
    return proxyResult(400, HttpMethod.POST, { message: 'Invalid request: body is required' });
  }

  try {
    const body = JSON.parse(event.body);
    const { product, message } = validateProduct<ProductWithoutId>(body, false);
    if (message || !product) {
      return proxyResult(400, HttpMethod.POST, { message });
    }

    const id = randomUUID();
    await createProduct(dbDocClient, product, id);

    return proxyResult(201, HttpMethod.POST, {
      ...product,
      id,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.name === 'TransactionCanceledException') {
      return proxyResult(400, HttpMethod.POST, {
        message: 'Transaction failed. Product not created.',
        ...detailedMessage(error),
      });
    }

    return errorResult(error, HttpMethod.POST);
  }
};
