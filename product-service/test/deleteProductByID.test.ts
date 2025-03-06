import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lambda/deleteProductByID';
import { HttpMethod } from '../lambda/@types';
import { getReservedId } from '../db/utils';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Lambda Handler', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  const getEvent = (id: string | null) => {
    return {
      httpMethod: HttpMethod.DELETE,
      path: `/products/${id}`,
      pathParameters: id ? { id } : {},
    } as APIGatewayProxyEvent;
  };

  beforeEach(() => {
    ddbMock.reset();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log the formatted event information', async () => {
    const event = getEvent(crypto.randomUUID());

    await handler(event);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.httpMethod));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.path));
  });

  it('should return 400 if product ID is missing', async () => {
    const event = getEvent(null);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Product ID must be provided');
  });

  it('should return 403 if product ID is reserved', async () => {
    const event = getEvent(getReservedId(0));

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe('Deletion of this product is forbidden');
  });

  it('should return 404 if product is not found', async () => {
    const event = getEvent(crypto.randomUUID());

    ddbMock.resolvesOnce({});
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('Product not found');
  });

  it('should return 200 if product is successfully deleted', async () => {
    const id = crypto.randomUUID();
    const event = getEvent(id);
    ddbMock.resolvesOnce({
      Items: [{ id: { S: id }, title: { S: 'Test Product' } }],
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Product deleted successfully');
  });

  it('should return 400 if transaction fails', async () => {
    const id = crypto.randomUUID();
    const event = getEvent(id);
    ddbMock.resolvesOnce({
      Items: [{ id: { S: id }, title: { S: 'Test Product' } }],
    });
    const error = new Error('Transaction Canceled');
    error.name = 'TransactionCanceledException';
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Transaction failed. Product not deleted.');
  });

  it('should return 404 if product is not found', async () => {
    const event = getEvent(crypto.randomUUID());
    const error = new Error('Conditional Check Failed');
    error.name = 'ConditionalCheckFailedException';
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Product not found',
    });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const event = getEvent(crypto.randomUUID());
    const error = new Error('Internal Server Error');
    ddbMock.rejectsOnce(error);
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});
