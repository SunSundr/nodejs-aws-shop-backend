import { SQSEvent } from 'aws-lambda';
import { validateProduct } from './common/validateProduct';
import { Product } from '../db/types';
import { updateProduct } from './common/updateProduct';
import { dbDocClient } from '../db/client';
import { randomUUID } from 'crypto';
import { createProduct } from './common/createProduct';
import { notifySubscribers } from './common/notifySubscribers';

export const handler = async (event: SQSEvent) => {
  const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;
  if (!CREATE_PRODUCT_TOPIC_ARN) {
    throw new Error('CREATE_PRODUCT_TOPIC_ARN environment variable is not set');
  }

  const failedMessageIds: string[] = [];
  const productsMap = new Map<string, [Product, string]>();
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

      const mapId = `${product.id}-${product.title}`;
      if (productsMap.has(mapId)) {
        console.warn(`Duplicate product found for ID: ${product.id}. Using the latest value.`);
      }

      productsMap.set(mapId, [product, record.messageId]);
    } catch (error) {
      console.error('Error processing SQS record:', error);
      failedMessageIds.push(record.messageId);
    }
  }

  await Promise.all(
    Array.from(productsMap.values()).map(async (data) => {
      const [product, messageId] = data;
      if (failedMessageIds.includes(messageId)) return;

      try {
        if (product.id === 'none') {
          product.id = randomUUID();
          await createProduct(dbDocClient, product, product.id);
          console.log(`Product created with ID: ${product.id}`);
        } else {
          await updateProduct(dbDocClient, product);
          console.log(`Product updated with ID: ${product.id}`);
        }

        await notifySubscribers(product, CREATE_PRODUCT_TOPIC_ARN); // - does not cause errors
      } catch (error) {
        console.error(`Error processing product (ID: ${product.id}):`, error);
        failedMessageIds.push(messageId);
      }
    }),
  );

  return {
    batchItemFailures: failedMessageIds.map((id) => ({
      itemIdentifier: id,
    })),
  };
};
