import { handler } from '../lambda/getProductList';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { Stock } from '../db/types';
import { getProductsWithoutCount, getStock, products } from '../db/data';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
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
