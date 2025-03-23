import { handler } from '../lib/lambda/getProductList';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { Stock } from '../lib/db/types';
import { getProductsWithoutCount, getStock, products } from '../lib/db/data';
import { HttpMethod } from '../lib/lambda/@types';

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
      path: '/products',
    } as APIGatewayProxyEvent;

    await handler(event);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.httpMethod));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(event.path));
  });

  it('should return products with stock counts', async () => {
    const mockProducts = getProductsWithoutCount(products);
    const mockStocks = getStock(products);

    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .resolves({ Items: mockProducts })
      .on(ScanCommand, { TableName: STOCKS_TABLE_NAME })
      .resolves({ Items: mockStocks });

    const event = {} as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual(products);
  });

  it('should return products with count 0 if stock is not found', async () => {
    const mockProducts = getProductsWithoutCount(products);
    const mockStocks: Stock[] = [];

    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .resolves({ Items: mockProducts })
      .on(ScanCommand, { TableName: STOCKS_TABLE_NAME })
      .resolves({ Items: mockStocks });

    const event = {} as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual(products.map((product) => ({ ...product, count: 0 })));
  });

  it('should return 500 if there is an error', async () => {
    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .rejects(new Error('Internal Server Error'));

    const event = {} as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });

  it('should return empty array if no products are found', async () => {
    ddbMock
      .on(ScanCommand, { TableName: PRODUCTS_TABLE_NAME })
      .resolves({ Items: [] })
      .on(ScanCommand, { TableName: STOCKS_TABLE_NAME })
      .resolves({ Items: [] });

    const event = {} as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual([]);
  });
});
