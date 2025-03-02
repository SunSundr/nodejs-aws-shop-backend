import { handler } from '../lambda/getProductByID';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { Product, Stock } from '../db/types';
import { getProducts } from '../db/data';
import { HttpMethod } from '../lambda/@types';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Lambda Handler', () => {
  const consoleErrorSpy = jest.spyOn(globalThis.console, 'error').mockImplementation(() => {});
  const consoleLogSpy = jest.spyOn(globalThis.console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    ddbMock.reset();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log the formatted event information', async () => {
    const event = {
      httpMethod: HttpMethod.GET,
      path: '/products/7567ec4b-b10c-45c5-9345-fc73c48a8000',
    } as APIGatewayProxyEvent;

    await handler(event);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.httpMethod));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.path));
  });

  it('should return 403 if product ID is not provided', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/products',
      pathParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe('Product ID must be provided');
  });

  it('should return 404 if product is not found', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/products/123',
      pathParameters: { id: '123' },
    } as unknown as APIGatewayProxyEvent;

    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('Product not found');
  });

  it('should return product with stock count if found', async () => {
    const mockProduct: Product = getProducts()[0];
    const mockStock: Stock = { product_id: mockProduct.id, count: mockProduct.count };

    const event = {
      httpMethod: 'GET',
      path: `/products/${mockProduct.id}`,
      pathParameters: { id: mockProduct.id },
    } as unknown as APIGatewayProxyEvent;

    ddbMock
      .on(QueryCommand, {
        TableName: PRODUCTS_TABLE_NAME,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': mockProduct.id,
        },
      })
      .resolves({ Items: [mockProduct] })
      .on(GetCommand, {
        TableName: STOCKS_TABLE_NAME,
        Key: { product_id: mockProduct.id },
      })
      .resolves({ Item: mockStock });

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toMatchObject(mockProduct);
  });

  it('should return 500 if there is an error', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/products/123',
      pathParameters: { id: '123' },
    } as unknown as APIGatewayProxyEvent;

    ddbMock.on(QueryCommand).rejects(new Error('Internal Server Error'));
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});
