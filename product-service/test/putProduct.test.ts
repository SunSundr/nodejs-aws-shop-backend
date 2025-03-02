import { handler } from '../lambda/putProduct';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
// import { TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { getReservedId } from '../db/utils';

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn(),
    })),
  },
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  TransactWriteItemsCommand: jest.fn().mockImplementation((params) => ({
    ...params,
    CommandName: 'TransactWriteItemsCommand',
  })),
}));

describe('Lambda Handler', () => {
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sendMock = jest.fn();
    (DynamoDBDocumentClient.from as jest.Mock).mockImplementation(() => ({
      send: sendMock,
    }));
  });

  it('should return 400 if body is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/products',
      body: null,
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid request: body is required');
  });

  it('should return 400 if id or title is missing', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/products',
      body: JSON.stringify({ description: 'Test Description', price: 100, count: 10 }),
    } as unknown as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Invalid input data');
  });

  it('should return 403 if id is reserved', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/products',
      body: JSON.stringify({ id: getReservedId(0), title: 'Test Product', price: 100, count: 10 }),
    } as unknown as APIGatewayProxyEvent;
    const result = await handler(event);

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe('Modification of this product is forbidden');
  });

  /* it('should return 404 if product is not found', async () => {
    const event = {
      httpMethod: 'PUT',
      path: '/products',
      body: JSON.stringify({
        id: crypto.randomUUID(),
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        count: 10,
      }),
    } as unknown as APIGatewayProxyEvent;

    // sendMock.mockRejectedValueOnce({
    //   name: 'TransactionCanceledException',
    //   CancellationReasons: [
    //     {
    //       Code: 'ConditionalCheckFailed',
    //     },
    //   ],
    // });
    // const result = await handler(event);

    // const error = new Error('Transaction cancelled');
    // error.name = 'TransactionCanceledException';
    // (error as any).CancellationReasons = [
    //   {
    //     Code: 'ConditionalCheckFailed',
    //   },
    // ];
    // sendMock.mockRejectedValueOnce(error);

    (DynamoDBDocumentClient.from as jest.Mock).mockImplementation(() => ({
      send: sendMock.mockImplementation(async (command) => {
        if (command.CommandName === 'TransactWriteItemsCommand') {
          const error = new Error('Transaction cancelled');
          error.name = 'TransactionCanceledException';
          (error as any).CancellationReasons = [
            {
              Code: 'ConditionalCheckFailed',
            },
          ];
          throw error;
        }
        return {};
      }),
    }));

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Product not found',
    });
  }); */

  // it('should return 200 if product is successfully updated', async () => {
  //   const event = {
  //     httpMethod: 'PUT',
  //     path: '/products',
  //     body: JSON.stringify({
  //       id: crypto.randomUUID(),
  //       title: 'Test Product',
  //       description: 'Test Description',
  //       price: 100,
  //       count: 10,
  //     }),
  //   } as unknown as APIGatewayProxyEvent;

  //   sendMock.mockResolvedValue({});
  //   const result = await handler(event);

  //   expect(result.statusCode).toBe(200);
  //   expect(result.body).toBeNull();
  // });

  // it('should return 400 if transaction fails', async () => {
  //   const event = {
  //     httpMethod: 'PUT',
  //     path: '/products',
  //     body: JSON.stringify({
  //       id: crypto.randomUUID(),
  //       title: 'Test Product',
  //       description: 'Test Description',
  //       price: 100,
  //       count: 10,
  //     }),
  //   } as unknown as APIGatewayProxyEvent;

  //   sendMock.mockRejectedValue({
  //     name: 'TransactionCanceledException',
  //     message: 'Transaction failed',
  //   });

  //   const result = await handler(event);

  //   expect(result.statusCode).toBe(400);
  //   expect(JSON.parse(result.body).message).toBe('Transaction failed. Product not updated.');
  // });

  // it('should return 500 if an unexpected error occurs', async () => {
  //   const event = {
  //     httpMethod: 'PUT',
  //     path: '/products',
  //     body: JSON.stringify({
  //       id: crypto.randomUUID(),
  //       title: 'Test Product',
  //       description: 'Test Description',
  //       price: 100,
  //       count: 10,
  //     }),
  //   } as unknown as APIGatewayProxyEvent;

  //   sendMock.mockRejectedValue(new Error('Internal Server Error'));
  //   const result = await handler(event);

  //   expect(result.statusCode).toBe(500);
  //   expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  // });
});
