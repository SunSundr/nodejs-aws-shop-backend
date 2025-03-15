import { SQSEvent } from 'aws-lambda';
import { validateProduct } from './common/validateProduct';
import { Product } from '../db/types';
import { updateProduct } from './common/updateProduct';
import { dbDocClient } from '../db/client';
import { randomUUID } from 'crypto';
import { createProduct } from './common/createProduct';
import { notifySubscribers } from './common/notifySubscribers';

const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;
if (!CREATE_PRODUCT_TOPIC_ARN) {
  throw new Error('CREATE_PRODUCT_TOPIC_ARN environment variable is not set');
}

export const handler = async (event: SQSEvent) => {
  try {
    const productsMap = new Map<string, Product>();
    console.log('[INFO]', event.Records.length);
    for (const record of event.Records) {
      try {
        const body = JSON.parse(record.body);
        console.log('[INFO]', body);
        const { product, message } = validateProduct<Product>(body, true, true);

        if (message || !product) {
          console.error('Error:', message || 'Product is undefined', body);
          continue;
        }
        if (productsMap.has(product.id)) {
          console.warn(`Duplicate product found for ID: ${product.id}. Using the latest value.`);
        }

        productsMap.set(`${product.id}-${product.title}`, product);
      } catch (error) {
        console.error('Error processing SQS record:', error);
      }
    }

    await Promise.all(
      Array.from(productsMap.values()).map(async (product) => {
        try {
          if (product.id === 'none') {
            product.id = randomUUID();
            await createProduct(dbDocClient, product, product.id);
            console.log(`Product created with ID: ${product.id}`);
          } else {
            await updateProduct(dbDocClient, product);
            console.log(`Product updated with ID: ${product.id}`);
          }

          await notifySubscribers(product, CREATE_PRODUCT_TOPIC_ARN);
        } catch (error) {
          console.error(`Error processing product (ID: ${product.id}):`, error);
        }
      }),
    );
  } catch (error) {
    console.error('Unexpected error processing SQS messages:', error);
    throw error;
  }
};
