import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { QueryCommand as QueryCommandClient } from '@aws-sdk/client-dynamodb';
import { getProduct, getProductRaw } from '../lambda/common/getProduct';
import { getItem } from '../lambda/common/getItem';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);
const dbClient = new DynamoDBClient();
const dbDocClient = DynamoDBDocumentClient.from(dbClient);

jest.mock('../lambda/common/getItem', () => ({
  getItem: jest.fn(),
}));

const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;

describe('getProduct', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  it('should return a product with count when fullInfo is true', async () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: '100.00',
      description: 'Test Description',
    };
    const mockStock = { product_id: '1', count: 10 };

    ddbMock
      .on(QueryCommand, {
        TableName: 'products',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': '1' },
      })
      .resolves({ Items: [mockProduct] })
      .on(GetCommand, {
        TableName: 'stocks',
        Key: { product_id: '1' },
      })
      .resolves({ Item: mockStock });

    mockGetItem.mockReturnValue(mockProduct);
    const result = await getProduct(dbDocClient, '1', true);

    expect(result).toEqual({
      ...mockProduct,
      count: mockStock.count,
    });
    expect(mockGetItem).toHaveBeenCalledWith([mockProduct]);
  });

  it('should return a product without count when fullInfo is false', async () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: '100.00',
      description: 'Test Description',
    };

    ddbMock
      .on(QueryCommand, {
        TableName: 'products',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': '1' },
      })
      .resolves({ Items: [mockProduct] });

    mockGetItem.mockReturnValue(mockProduct);
    const result = await getProduct(dbDocClient, '1', false);

    expect(result).toEqual(mockProduct);
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should return undefined if product is not found', async () => {
    ddbMock
      .on(QueryCommand, {
        TableName: 'products',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': '1' },
      })
      .resolves({ Items: [] });
    mockGetItem.mockReturnValue(undefined);

    const result = await getProduct(dbDocClient, '1');

    expect(result).toBeUndefined();
  });
});

describe('getProductRaw', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.clearAllMocks();
  });

  it('should return raw product data', async () => {
    const mockProduct = { id: { S: '1' }, title: { S: 'Test Product' } };

    ddbMock
      .on(QueryCommandClient, {
        TableName: 'products',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': { S: '1' } },
      })
      .resolves({ Items: [mockProduct] });
    mockGetItem.mockReturnValue(mockProduct);

    const result = await getProductRaw(dbDocClient, '1');

    expect(result).toEqual(mockProduct);
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should return undefined if product is not found', async () => {
    ddbMock
      .on(QueryCommandClient, {
        TableName: 'products',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': { S: '1' } },
      })
      .resolves({ Items: [] });
    mockGetItem.mockReturnValue(undefined);

    const result = await getProductRaw(dbDocClient, '1');

    expect(result).toBeUndefined();
  });
});
