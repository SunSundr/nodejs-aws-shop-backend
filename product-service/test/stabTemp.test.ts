import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getHeaders } from '../lib/lambda/@headers';
import { cart, orders } from '../lib/lambda/@mockData';
import { HttpMethod } from '../lib/lambda/@types';

jest.mock('../lib/lambda/@headers', () => ({
  getHeaders: jest.fn((methods: HttpMethod[]) => ({
    'Access-Control-Allow-Methods': methods.join(','),
    'Access-Control-Allow-Origin': HttpMethod.ANY,
  })),
}));

// --------------------------------------------
const stubFiles = [
  ['deleteOrder.ts', HttpMethod.DELETE, null],
  ['getOrders.ts', HttpMethod.GET, orders],
  ['getProfileCart.ts', HttpMethod.GET, cart],
  ['putOrder.ts', HttpMethod.PUT, null],
  ['putOrderStatus.ts', HttpMethod.PUT, null],
];

stubFiles.forEach((file) => {
  describe(`Lambda Handler (${file[0]})`, () => {
    let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
    beforeAll(async () => {
      handler = (await import(`../lib/lambda/${file[0]}`)).handler;
    });
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 200 status code and correct headers', async () => {
      const event = {} as APIGatewayProxyEvent;
      const result = await handler(event);
      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Access-Control-Allow-Methods': file[1],
        'Access-Control-Allow-Origin': '*',
      });
      expect(result.body).toBe(JSON.stringify(file[2]));
      expect(getHeaders).toHaveBeenCalledWith([file[1]]);
    });
  });
});

// --------------------------------------------
describe('Lambda Handler (putProfileCart.ts)', () => {
  let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
  beforeAll(async () => {
    handler = (await import('../lib/lambda/putProfileCart')).handler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultHeaders = {
    'Access-Control-Allow-Methods': HttpMethod.PUT,
    'Access-Control-Allow-Origin': HttpMethod.ANY,
  };

  const getEvent = (body: unknown): APIGatewayProxyEvent =>
    ({ body }) as unknown as APIGatewayProxyEvent;

  it('should return 400 status code if body is missing', async () => {
    const event = getEvent(null);
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: 'Invalid request: body is required' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([HttpMethod.PUT]);
  });

  it('should return 200 status code and null body if body is provided', async () => {
    const event = getEvent(JSON.stringify({ productId: '1', quantity: 2 }));
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(null));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([HttpMethod.PUT]);
  });
});

// --------------------------------------------
describe('Lambda Handler (getOrderById.ts)', () => {
  let handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
  beforeAll(async () => {
    handler = (await import('../lib/lambda/getOrderById')).handler;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultHeaders = {
    'Access-Control-Allow-Methods': HttpMethod.GET,
    'Access-Control-Allow-Origin': HttpMethod.ANY,
  };

  const getEvent = (id: string | null): APIGatewayProxyEvent =>
    ({ pathParameters: { id } }) as unknown as APIGatewayProxyEvent;

  it('should return 200 status code and order data if order is found', async () => {
    const id = orders[0].id;
    const event = getEvent(id);
    const result: APIGatewayProxyResult = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(orders[0]));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([HttpMethod.GET]);
  });

  it('should return 404 status code if order is not found', async () => {
    const event = getEvent('Non-existent ID');
    const result: APIGatewayProxyResult = await handler(event);
    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: 'Order not found' }));
    expect(result.headers).toEqual(defaultHeaders);
    expect(getHeaders).toHaveBeenCalledWith([HttpMethod.GET]);
  });
});
