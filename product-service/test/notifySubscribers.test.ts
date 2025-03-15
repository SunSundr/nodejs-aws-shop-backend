import { Product } from '../db/types';
import { notifySubscribers } from '../lambda/common/notifySubscribers';
import { PublishCommand } from '@aws-sdk/client-sns';
import { DEFAULT_CATEGORY } from '../lib/constants';

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PublishCommand: jest.fn(),
}));

const mockPublishCommand = jest.mocked(PublishCommand);
const topicArn = 'arn:aws:sns:region:account-id:topic-name';

describe('notifySubscribers', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should send a notification with the correct parameters', async () => {
    const product: Product = {
      id: crypto.randomUUID(),
      title: 'Test Product',
      category: DEFAULT_CATEGORY,
      description: 'Test Description',
      price: 100,
      count: 10,
    };

    await notifySubscribers(product, topicArn);

    expect(mockPublishCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        TopicArn: topicArn,
        Message: expect.any(String),
        Subject: expect.any(String),
        MessageAttributes: expect.objectContaining({
          price: expect.objectContaining({
            DataType: 'Number',
            StringValue: expect.any(String),
          }),
          keywords: expect.objectContaining({
            DataType: 'String',
            StringValue: expect.any(String),
          }),
        }),
      }),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(`Notification sent for product: ${product.title}`);
  });

  it('should throw an error if the price is invalid', async () => {
    const product = {
      id: crypto.randomUUID(),
      title: 'Test Product',
      category: DEFAULT_CATEGORY,
      description: 'Test Description',
      price: 'invalid',
      count: 10,
    } as unknown as Product;
    await notifySubscribers(product, topicArn);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending notification:', expect.any(Error));
  });
});
