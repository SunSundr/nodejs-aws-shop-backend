import { SQSEvent } from 'aws-lambda';
import { validateProduct } from './common/validateProduct';
import { Product } from '../db/types';
import { updateProduct } from './common/updateProduct';
import { dbDocClient } from '../db/client';
import { randomUUID } from 'crypto';
import { createProduct } from './common/createProduct';
// import { dbDocClient } from '../db/client';
// import { updateProduct } from './common/updateProduct';
// import { createProduct } from './common/createProduct';

// const snsClient = new SNSClient();

export const handler = async (event: SQSEvent) => {
  try {
    const productsMap = new Map<string, Product>();

    for (const record of event.Records) {
      try {
        const body = JSON.parse(record.body);
        const { product, message } = validateProduct<Product>(body, true, true);

        if (message || !product) {
          console.error('Error:', message || 'Product is undefined', body);
          continue;
        }
        if (productsMap.has(product.id)) {
          console.warn(`Duplicate product found for ID: ${product.id}. Using the latest value.`);
        }
        productsMap.set(product.id, product);
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
