process.env.CREATE_PRODUCT_TOPIC_ARN = 'arn:aws:sns:region:account-id:topic-name';
import { handler } from '../lambda/catalogBatchProcess';
import { SQSEvent } from 'aws-lambda';
import { validateProduct } from '../lambda/common/validateProduct';
import { updateProduct } from '../lambda/common/updateProduct';
import { createProduct } from '../lambda/common/createProduct';
import { notifySubscribers } from '../lambda/common/notifySubscribers';
import { dbDocClient } from '../db/client';
import { randomUUID } from 'crypto';

jest.mock('../lambda/common/validateProduct');
jest.mock('../lambda/common/updateProduct');
jest.mock('../lambda/common/createProduct');
jest.mock('../lambda/common/notifySubscribers');
jest.mock('../db/client');
jest.mock('crypto');

describe('handler', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = jest.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should process SQS records and create/update products', async () => {
    (validateProduct as jest.Mock).mockReturnValue({
      product: {
        id: '123',
        title: 'Test Product',
        price: '100.00',
        description: 'Test Description',
      },
      message: null,
    });

    (updateProduct as jest.Mock).mockResolvedValue(undefined);
    (createProduct as jest.Mock).mockResolvedValue(undefined);

    (notifySubscribers as jest.Mock).mockResolvedValue(undefined);

    (randomUUID as jest.Mock).mockReturnValue('generated-uuid');

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            id: '123',
            title: 'Test Product',
            price: '100.00',
            description: 'Test Description',
          }),
          messageId: '1',
          receiptHandle: 'handle1',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1633036800000',
            SenderId: '123456789012',
            ApproximateFirstReceiveTimestamp: '1633036800000',
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    await handler(event);

    expect(validateProduct).toHaveBeenCalledTimes(1);
    expect(updateProduct).toHaveBeenCalledWith(dbDocClient, {
      id: '123',
      title: 'Test Product',
      price: '100.00',
      description: 'Test Description',
    });
    expect(notifySubscribers).toHaveBeenCalledWith(
      { id: '123', title: 'Test Product', price: '100.00', description: 'Test Description' },
      process.env.CREATE_PRODUCT_TOPIC_ARN,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 1);
    expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', {
      id: '123',
      title: 'Test Product',
      price: '100.00',
      description: 'Test Description',
    });
  });

  it('should handle product creation if product ID is "none"', async () => {
    (validateProduct as jest.Mock).mockReturnValue({
      product: { id: 'none', title: 'New Product', price: '50.00', description: 'New Description' },
      message: null,
    });

    (createProduct as jest.Mock).mockResolvedValue(undefined);

    (notifySubscribers as jest.Mock).mockResolvedValue(undefined);

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            id: 'none',
            title: 'New Product',
            price: '50.00',
            description: 'New Description',
          }),
          messageId: '1',
          receiptHandle: 'handle1',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1633036800000',
            SenderId: '123456789012',
            ApproximateFirstReceiveTimestamp: '1633036800000',
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    await handler(event);

    expect(createProduct).toHaveBeenCalledWith(
      dbDocClient,
      {
        id: 'generated-uuid',
        title: 'New Product',
        price: '50.00',
        description: 'New Description',
      },
      'generated-uuid',
    );

    expect(notifySubscribers).toHaveBeenCalledWith(
      {
        id: 'generated-uuid',
        title: 'New Product',
        price: '50.00',
        description: 'New Description',
      },
      process.env.CREATE_PRODUCT_TOPIC_ARN,
    );
  });

  it('should log errors for invalid products', async () => {
    (validateProduct as jest.Mock).mockReturnValue({
      product: null,
      message: 'Invalid product data',
    });

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            id: 'invalid',
            title: 'Invalid Product',
            price: 'invalid',
            description: 'Invalid Description',
          }),
          messageId: '1',
          receiptHandle: 'handle1',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1633036800000',
            SenderId: '123456789012',
            ApproximateFirstReceiveTimestamp: '1633036800000',
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    await handler(event);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Invalid product data', {
      id: 'invalid',
      title: 'Invalid Product',
      price: 'invalid',
      description: 'Invalid Description',
    });
  });

  it('should log errors for failed product processing', async () => {
    (validateProduct as jest.Mock).mockReturnValue({
      product: {
        id: '123',
        title: 'Test Product',
        price: '100.00',
        description: 'Test Description',
      },
      message: null,
    });

    (updateProduct as jest.Mock).mockRejectedValue(new Error('Failed to update product'));

    const event: SQSEvent = {
      Records: [
        {
          body: JSON.stringify({
            id: '123',
            title: 'Test Product',
            price: '100.00',
            description: 'Test Description',
          }),
          messageId: '1',
          receiptHandle: 'handle1',
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1633036800000',
            SenderId: '123456789012',
            ApproximateFirstReceiveTimestamp: '1633036800000',
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    await handler(event);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error processing product (ID: 123):`,
      expect.any(Error),
    );
  });
});
