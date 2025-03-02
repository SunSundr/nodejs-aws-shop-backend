import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lambda/putProduct';
import { getReservedId } from '../db/utils';
import { HttpMethod } from '../lambda/@types';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Lambda Handler', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  const getEvent = (body: unknown) => {
    return {
      httpMethod: HttpMethod.PUT,
      path: '/products',
      body,
    } as APIGatewayProxyEvent;
  };
  const testBody = JSON.stringify({
    id: crypto.randomUUID(),
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    count: 10,
  });

  beforeEach(() => {
    ddbMock.reset();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log the formatted event information', async () => {
    const event = getEvent({});

    await handler(event);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.httpMethod));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.path));
  });

  it('should return 200 if product is successfully updated', async () => {
    const event = getEvent(testBody);
    ddbMock.resolvesOnce({});

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toBeNull();
  });

  it('should return 400 if body is missing', async () => {
    const event = getEvent(null);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid request: body is required');
  });

  it('should return 400 if `id` or `title` is missing', async () => {
    const event = getEvent(
      JSON.stringify({ description: 'Test Description', price: 100, count: 10 }),
    );
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid input data');
  });

  it('should return 403 if `id` is reserved', async () => {
    const event = getEvent(
      JSON.stringify({
        id: getReservedId(0),
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        count: 10,
      }),
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe('Modification of this product is forbidden');
  });

  it('should return 400 if count or price is negative', async () => {
    const event = getEvent(
      JSON.stringify({
        id: crypto.randomUUID(),
        title: 'Test Product',
        description: 'Test Description',
        price: -100,
        count: -10,
      }),
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Price and count must be non-negative');
  });

  it('should return 404 if product is not found', async () => {
    const event = getEvent(testBody);
    const error = new Error('Conditional Check Failed');
    error.name = 'ConditionalCheckFailedException';
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Product not found',
    });
  });

  it('should return 400 if transaction fails', async () => {
    const event = getEvent(testBody);
    const error = new Error('Transaction Canceled');
    error.name = 'TransactionCanceledException';
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Transaction failed. Product not updated.');
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const event = getEvent(testBody);
    const error = new Error('Internal Server Error');
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});
