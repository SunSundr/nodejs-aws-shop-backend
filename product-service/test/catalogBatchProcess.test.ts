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

const createProductTopicArn = 'arn:aws:sns:region:account-id:topic-name';
process.env.CREATE_PRODUCT_TOPIC_ARN = createProductTopicArn;

interface FakeProduct {
  id: string;
  title: string;
  price: number | string;
  description: string;
}

const getRecord = (fakeProduct: FakeProduct, count = 1) => {
  return new Array(count).fill({
    body: JSON.stringify(fakeProduct),
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
  });
};

const getEvent = (
  fakeProduct: {
    id: string;
    title: string;
    price: number | string;
    description: string;
  },
  count = 1,
): SQSEvent => ({
  Records: getRecord(fakeProduct, count),
});

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

  it('should throw an error if CREATE_PRODUCT_TOPIC_ARN is not set', async () => {
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;

    await expect(
      handler(
        getEvent({
          id: '123',
          title: 'Test Product',
          price: '100.00',
          description: 'Test Description',
        }),
      ),
    ).rejects.toThrow('CREATE_PRODUCT_TOPIC_ARN environment variable is not set');
    process.env.CREATE_PRODUCT_TOPIC_ARN = createProductTopicArn;
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

    await handler(
      getEvent({
        id: '123',
        title: 'Test Product',
        price: '100.00',
        description: 'Test Description',
      }),
    );

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
    const createResult = {
      id: 'generated-uuid',
      title: 'New Product',
      price: '50.00',
      description: 'New Description',
    };
    (validateProduct as jest.Mock).mockReturnValue({
      product: { id: 'none', title: 'New Product', price: '50.00', description: 'New Description' },
      message: null,
    });
    (createProduct as jest.Mock).mockResolvedValue(undefined);
    (notifySubscribers as jest.Mock).mockResolvedValue(undefined);

    await handler(
      getEvent({
        id: '123',
        title: 'Test Product',
        price: '100.00',
        description: 'Test Description',
      }),
    );

    expect(createProduct).toHaveBeenCalledWith(dbDocClient, createResult, createResult.id);
    expect(notifySubscribers).toHaveBeenCalledWith(
      createResult,
      process.env.CREATE_PRODUCT_TOPIC_ARN,
    );
  });

  it('should log errors for invalid products', async () => {
    const body = {
      id: 'invalid',
      title: 'Invalid Product',
      price: 'invalid',
      description: 'Invalid Description',
    };
    (validateProduct as jest.Mock).mockReturnValue({
      product: null,
      message: 'Invalid product data',
    });

    await handler(getEvent(body));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Invalid product data', body);

    (validateProduct as jest.Mock).mockReturnValue({});

    await handler(getEvent(body));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', 'Product is undefined', body);
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

    await handler(
      getEvent({
        id: 'invalid',
        title: 'Invalid Product',
        price: 'invalid',
        description: 'Invalid Description',
      }),
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error processing product (ID: 123):`,
      expect.any(Error),
    );
  });

  it('should log a warning for duplicate products', async () => {
    const product = {
      id: '123',
      title: 'Test Product',
      price: '100.00',
      description: 'Test Description',
    };

    (validateProduct as jest.Mock).mockReturnValue({
      product,
      message: null,
    });

    await handler(getEvent(product, 2));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Duplicate product found for ID: ${product.id}. Using the latest value.`,
    );
  });

  it('should log an error when processing an SQS record fails', async () => {
    const invalidProduct = {
      id: 'invalid',
      title: 'Invalid Product',
      price: 'invalid',
      description: 'Invalid Description',
    };

    (validateProduct as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to validate product');
    });

    await handler(getEvent(invalidProduct));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing SQS record:', expect.any(Error));
  });
});
