import { Product } from '../../db/types';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const snsClient = new SNSClient();

export const notifySubscribers = async (product: Product, topicArn: string) => {
  try {
    const numericPrice = Number(product.price);
    console.log('Price being sent:', numericPrice);
    if (isNaN(numericPrice)) {
      throw new Error('Invalid price value');
    }
    const subject = `SunSundr★Store | New Product Created: ${product.title}`;

    const message = `
      A new product has been created:
      - Title: ${product.title}
      - Price: $${product.price}
      - Description: ${product.description}
    `;

    const params = {
      TopicArn: topicArn,
      Message: message,
      Subject: subject,
      MessageAttributes: {
        price: {
          DataType: 'Number',
          StringValue: Math.round(numericPrice).toString(),
        },
        keywords: {
          DataType: 'String',
          StringValue: `${product.title} ${product.description}`,
        },
      },
    };

    const command = new PublishCommand(params);
    await snsClient.send(command);
    console.log(`Notification sent for product: ${product.title}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
