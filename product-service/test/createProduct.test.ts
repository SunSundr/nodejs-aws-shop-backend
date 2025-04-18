import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lib/lambda/createProduct';
import { HttpMethod } from '../lib/lambda/@types';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Lambda Handler', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  const getEvent = (body: unknown) => {
    return {
      httpMethod: HttpMethod.POST,
      path: '/products',
      body,
    } as APIGatewayProxyEvent;
  };
  const testBody = JSON.stringify({
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    count: 10,
    imageURL: 'https://image.url',
  });

  beforeEach(() => {
    ddbMock.reset();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log the formatted event information', async () => {
    const event = getEvent(testBody);

    await handler(event);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.httpMethod));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.path));
  });

  it('should return 400 if body is missing', async () => {
    const event = getEvent(null);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid request: body is required');
  });

  it('should return 400 if required fields are missing or invalid', async () => {
    const event = getEvent(JSON.stringify({}));

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid input data');
  });

  it('should return 400 if price or count are represented as empty strings', async () => {
    const event = getEvent(
      JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: '',
        count: '',
        imageURL: 'https://image.url',
      }),
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid input data');
  });

  it('should return 400 if category format is invalid', async () => {
    const event = getEvent(
      JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        count: 10,
        imageURL: 'https://image.url',
        category: true, // invalid format
      }),
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid category format');
  });

  it('should return 400 if count or price is negative', async () => {
    const event = getEvent(
      JSON.stringify({
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

  it('should return 400 if imageURL format is invalid', async () => {
    const event = getEvent(
      JSON.stringify({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        count: 10,
        imageURL: true,
      }),
    );

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid imageURL format');
  });

  it('should return 201 if product is successfully created', async () => {
    const event = getEvent(testBody);
    ddbMock.resolvesOnce({});

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.id).toBeDefined();
    expect(responseBody.title).toBe('Test Product');
    expect(responseBody.description).toBe('Test Description');
    expect(responseBody.price).toBe(100);
    expect(responseBody.count).toBe(10);
    expect(responseBody.imageURL).toBe('https://image.url');
  });

  it('should return 201 if product is successfully created without imageURL', async () => {
    const bodyWithoutImage = JSON.stringify({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      count: 10,
    });
    const event = getEvent(bodyWithoutImage);
    ddbMock.resolvesOnce({});

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.id).toBeDefined();
    expect(responseBody.title).toBe('Test Product');
    expect(responseBody.description).toBe('Test Description');
    expect(responseBody.price).toBe(100);
    expect(responseBody.count).toBe(10);
    expect(responseBody.imageURL).toBeUndefined();
  });

  it('should return 201 if the product is successfully created and its price and count are represented as strings.', async () => {
    const bodyWithoutImage = JSON.stringify({
      title: 'Test Product',
      description: 'Test Description',
      price: '100',
      count: '10',
    });
    const event = getEvent(bodyWithoutImage);
    ddbMock.resolvesOnce({});

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const responseBody = JSON.parse(result.body);
    expect(responseBody.price).toBe(100);
    expect(responseBody.count).toBe(10);
  });

  it('should return 400 if transaction fails', async () => {
    const event = getEvent(testBody);
    const error = new Error('Transaction Canceled');
    error.name = 'TransactionCanceledException';
    ddbMock.rejectsOnce(error);

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Transaction failed. Product not created.');
  });

  it('should return 500 if an unexpected error occurs', async () => {
    const event = getEvent(testBody);
    ddbMock.rejectsOnce(new Error('Internal Server Error'));

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});
