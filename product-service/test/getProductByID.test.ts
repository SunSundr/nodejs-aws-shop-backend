import { APIGatewayProxyEvent } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { handler } from '../lambda/getProductByID';
import { getHeaders } from '../lambda/@headers';
import { products } from '../db/data';

jest.mock('../lambda/@headers', () => ({
  getHeaders: jest.fn((methods: CorsHttpMethod[]) => ({
    'Access-Control-Allow-Methods': methods.join(','),
    'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
  })),
}));

const defaultHeaders = {
  'Access-Control-Allow-Methods': CorsHttpMethod.GET,
  'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
};

describe('Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getEvent = (id: string | null): APIGatewayProxyEvent =>
    ({ pathParameters: { id } }) as unknown as APIGatewayProxyEvent;

  it('should return 403 status code if ID is not provided', async () => {
    const event = getEvent(null);
    const result = await handler(event);
    expect(result.statusCode).toBe(403);
    expect(result.body).toBe(JSON.stringify({ message: 'ID must be provided' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.GET]);
  });

  it('should return 404 status code if product is not found', async () => {
    const event = getEvent('Non-existent ID');
    const result = await handler(event);
    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: 'Product not found' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.GET]);
  });

  it('should return 200 status code and product data if product is found', async () => {
    const id = products[0].id;
    const event = getEvent(id);
    const result = await handler(event);
    const product = products.find((item) => item.id === id);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(product));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.GET]);
  });
});
