import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { handler } from '../lambda/putProduct';
import { products } from '../lambda/@mockData';
import { getHeaders } from '../lambda/@headers';

jest.mock('../lambda/@headers', () => ({
  getHeaders: jest.fn((methods: CorsHttpMethod[]) => ({
    'Access-Control-Allow-Methods': methods.join(','),
    'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
  })),
}));

const defaultHeaders = {
  'Access-Control-Allow-Methods': CorsHttpMethod.PUT,
  'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
};

describe('Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getEvent = (body: unknown): APIGatewayProxyEvent =>
    ({ body }) as unknown as APIGatewayProxyEvent;

  it('should return 400 status code if body is missing', async () => {
    const event = getEvent(null);
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: 'Invalid request: body is required' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.PUT]);
  });

  it('should return 400 status code if JSON is invalid', async () => {
    const event = getEvent('invalid-json');
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: 'Invalid JSON format' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.PUT]);
  });

  it('should return 400 status code if product ID is missing', async () => {
    const event = getEvent(JSON.stringify({ name: 'Product 1' }));
    const result: APIGatewayProxyResult = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: 'Product ID is required' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.PUT]);
  });

  it('should return 404 status code if product is not found', async () => {
    const event = getEvent(JSON.stringify({ id: 'Non-existent ID' }));
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: 'Product not found' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.PUT]);
  });

  it('should return 200 status code and product data if product is found', async () => {
    const id = products[0].id;
    const event = getEvent(JSON.stringify({ id }));
    const result = await handler(event);
    const product = products.find((item) => item.id === id);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ message: 'Product updated successfully', product }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.PUT]);
  });
});
