import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } from '../../lib/constants';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface ProductServiceDatabaseProps {
  lambdas: {
    getProductsList: NodejsFunction;
    getProductByID: NodejsFunction;
    postProduct: NodejsFunction;
    deleteProductByID: NodejsFunction;
    putProduct: NodejsFunction;
    catalogBatchProcess: NodejsFunction;
  };
}

export class DynamoDBTables extends Construct {
  public readonly productsTable: dynamodb.TableV2;
  public readonly stocksTable: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: ProductServiceDatabaseProps) {
    super(scope, id);
    const {
      getProductsList,
      getProductByID,
      postProduct,
      deleteProductByID,
      putProduct,
      catalogBatchProcess,
    } = props.lambdas;

    // Products table:
    this.productsTable = new dynamodb.TableV2(this, 'ProductsTable', {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(), // PAY_PER_REQUEST
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(), // DEFAULT encryption
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.productsTable.grant(getProductByID, 'dynamodb:Query');
    this.productsTable.grant(getProductsList, 'dynamodb:Scan');
    this.productsTable.grant(
      postProduct,
      'dynamodb:Query',
      'dynamodb:TransactWriteItems',
      'dynamodb:PutItem',
    );
    this.productsTable.grant(
      deleteProductByID,
      'dynamodb:Query',
      'dynamodb:TransactWriteItems',
      'dynamodb:DeleteItem',
    );
    this.productsTable.grant(
      putProduct,
      'dynamodb:Query',
      'dynamodb:TransactWriteItems',
      'dynamodb:UpdateItem',
    );

    this.productsTable.grant(
      catalogBatchProcess,
      'dynamodb:Query',
      'dynamodb:TransactWriteItems',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
    );

    // Stocks table:
    this.stocksTable = new dynamodb.TableV2(this, 'StocksTable', {
      tableName: STOCKS_TABLE_NAME,
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(), // PAY_PER_REQUEST
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(), // DEFAULT encryption
      tableClass: dynamodb.TableClass.STANDARD,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.stocksTable.addGlobalSecondaryIndex({
      indexName: 'ProductIndex',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
    });

    this.stocksTable.grant(getProductByID, 'dynamodb:GetItem');
    this.stocksTable.grant(getProductsList, 'dynamodb:Scan');
    this.stocksTable.grant(postProduct, 'dynamodb:TransactWriteItems', 'dynamodb:PutItem');
    this.stocksTable.grant(deleteProductByID, 'dynamodb:TransactWriteItems', 'dynamodb:DeleteItem');
    this.stocksTable.grant(putProduct, 'dynamodb:TransactWriteItems', 'dynamodb:UpdateItem');
    this.stocksTable.grant(
      catalogBatchProcess,
      'dynamodb:TransactWriteItems',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
    );
  }
}
