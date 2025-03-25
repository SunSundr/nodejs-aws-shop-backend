import { TransactWriteItem, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../db/types';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../../constants';
import { getProductRaw } from './getProduct';
import { deleteProductTransactionItems } from './deleteProduct';
import { createProductTransactionItems } from './createProduct';

export function getUpdateProductTransactionItems(product: Product): TransactWriteItem[] {
  const { id, category, title, description, price, count, imageURL } = product;
  const commonSet = 'SET title = :title, description = :description, price = :price';

  const transactionItems: TransactWriteItem[] = [
    {
      Update: {
        TableName: PRODUCTS_TABLE_NAME,
        Key: {
          id: { S: id },
          category: { S: category },
        },
        UpdateExpression:
          imageURL === '' || imageURL === null
            ? `REMOVE imageURL ${commonSet}`
            : imageURL !== undefined
              ? `${commonSet}, imageURL = :imageURL`
              : commonSet,
        ExpressionAttributeValues: {
          ':title': { S: title },
          ':description': { S: description },
          ':price': { N: price.toString() },
          ...(imageURL !== '' &&
            imageURL !== undefined &&
            imageURL !== null && { ':imageURL': { S: imageURL } }),
        },
        ConditionExpression: 'attribute_exists(id) AND attribute_exists(category)',
      },
    },
    {
      Update: {
        TableName: STOCKS_TABLE_NAME,
        Key: {
          product_id: { S: id },
        },
        UpdateExpression: 'SET #count = :count',
        ExpressionAttributeNames: {
          '#count': 'count',
        },
        ExpressionAttributeValues: {
          ':count': { N: count.toString() },
        },
        ConditionExpression: 'attribute_exists(product_id)',
      },
    },
  ];

  return transactionItems;
}

export async function updateProduct(
  dbDocClient: DynamoDBDocumentClient | DynamoDBDocument,
  product: Product,
) {
  const transactionItems: TransactWriteItem[] = [];

  const productRaw = await getProductRaw(dbDocClient, product.id);
  if (productRaw && productRaw.category.S !== product.category) {
    transactionItems.push(...deleteProductTransactionItems(product.id, productRaw.category.S!));
    transactionItems.push(...createProductTransactionItems(product, product.id));
  } else {
    transactionItems.push(...getUpdateProductTransactionItems(product));
  }

  const transactionCommand = new TransactWriteItemsCommand({
    TransactItems: transactionItems,
  });

  await dbDocClient.send(transactionCommand);
}
