import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { getItem } from '../lib/lambda/common/getItem';

describe('getItem', () => {
  it('should return the first item if array has one element', () => {
    const items = [{ id: { S: '1' }, title: { S: 'Test Product' } }];
    const result = getItem<Record<string, AttributeValue>>(items);
    expect(result).toEqual(items[0]);
  });

  it('should return undefined if array is empty', () => {
    const items: unknown[] = [];
    const result = getItem(items);
    expect(result).toBeUndefined();
  });

  it('should throw an error if array has more than one element', () => {
    const items = [
      { id: { S: '1' }, title: { S: 'Test Product 1' } },
      { id: { S: '2' }, title: { S: 'Test Product 2' } },
    ];
    expect(() => getItem(items)).toThrow('Internal error: DynamoDB table structure is Invalid');
  });

  it('should throw an error if items is undefined', () => {
    expect(() => getItem(undefined)).toThrow('Internal error: Invalid response from DynamoDB');
  });
});
