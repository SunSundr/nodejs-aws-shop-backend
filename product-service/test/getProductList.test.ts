import { APIGatewayProxyResult } from 'aws-lambda';
import { CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { handler } from '../lambda/getProductList';
import { getHeaders } from '../lambda/@headers';
import { products } from '../lambda/@mockData';

jest.mock('../lambda/@headers', () => ({
  getHeaders: jest.fn((methods: CorsHttpMethod[]) => ({
    'Access-Control-Allow-Methods': methods.join(','),
    'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
  })),
}));

describe('Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 status code, correct headers, and products in the body', async () => {
    const result: APIGatewayProxyResult = await handler();
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(products));
    expect(result.headers).toEqual({
      'Access-Control-Allow-Methods': CorsHttpMethod.GET,
      'Access-Control-Allow-Origin': CorsHttpMethod.ANY,
    });
    expect(getHeaders).toHaveBeenCalledWith([CorsHttpMethod.GET]);
  });
});
