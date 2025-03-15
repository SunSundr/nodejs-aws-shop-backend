import { ScanCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dbDocClient } from './client';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../lib/constants';
import { getProductsWithoutCount, products } from './data';

async function clearTable(tableName: string) {
  const scanCommand = new ScanCommand({ TableName: tableName });
  const scanResult = await dbDocClient.send(scanCommand);

  if (scanResult.Items) {
    for (const item of scanResult.Items) {
      const deleteCommand = new DeleteCommand({
        TableName: tableName,
        Key:
          tableName === PRODUCTS_TABLE_NAME
            ? { id: item.id, category: item.category }
            : { product_id: item.product_id },
      });
      await dbDocClient.send(deleteCommand);
    }
  }
  console.log(`Table ${tableName} cleared.`);
}

async function populateProductsTable() {
  const productsWithoutCount = getProductsWithoutCount(products);
  for (const product of productsWithoutCount) {
    const putCommand = new PutCommand({
      TableName: PRODUCTS_TABLE_NAME,
      Item: {
        ...product,
      },
    });
    await dbDocClient.send(putCommand);
  }
  console.log('Products table populated.');
}

async function populateStocksTable() {
  for (const product of products) {
    const putCommand = new PutCommand({
      TableName: STOCKS_TABLE_NAME,
      Item: {
        product_id: product.id,
        count: product.count,
      },
    });
    await dbDocClient.send(putCommand);
  }
  console.log('Stocks table populated.');
}

async function restoreDatabase() {
  try {
    await Promise.all([clearTable(PRODUCTS_TABLE_NAME), clearTable(STOCKS_TABLE_NAME)]);
    await Promise.all([populateProductsTable(), populateStocksTable()]);

    console.log('Database restored successfully.');
  } catch (error) {
    console.error('Error restoring database:', error);
  }
}

if (require.main === module) {
  restoreDatabase();
}

export { restoreDatabase };
