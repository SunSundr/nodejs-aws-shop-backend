import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';
import { Construct } from 'constructs';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
// import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { DynamoDBTables } from '../db/tables';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = process.env.STAGE || 'dev';
    const httpMethod = cdk.aws_apigatewayv2.HttpMethod;
    const runtime = Runtime.NODEJS_22_X;

    const catalogItemsQueue = new sqs.Queue(this, 'ProductsQueue', {
      queueName: 'CatalogItemsQueue',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const catalogLambdaHandler = new NodejsFunction(this, 'CatalogBatchProcessLambda', {
      runtime,
      functionName: 'CatalogBatchProcess',
      entry: path.join(__dirname, '../lambda/catalogBatchProcess.ts'),
      // environment: {
      //   SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
      // },
    });

    catalogLambdaHandler.addEventSource(new SqsEventSource(catalogItemsQueue, { batchSize: 5 }));

    new cdk.CfnOutput(this, 'CatalogItemsQueueUrlOutput', {
      value: catalogItemsQueue.queueUrl,
    });
    new cdk.CfnOutput(this, 'CatalogItemsQueueArn', {
      value: catalogItemsQueue.queueArn,
    });

    // API Gateway
    const api = new RestApi(this, 'ProductServiceAPI', {
      restApiName: 'ProductServiceAPI',
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        // allowMethods: Cors.ALL_METHODS,
      },
    });

    // Lambda functions
    // --------------------------------------------------------------

    // GET (/products)
    const productsLambda = new NodejsFunction(this, 'ProductsLambda', {
      runtime,
      functionName: 'GetProductList',
      entry: path.join(__dirname, '../lambda/getProductList.ts'),
      // bundling: {
      //   minify: true,
      //   target: 'node22',
      // },
    });

    // GET (/products/:id)
    const productLambda = new NodejsFunction(this, 'ProductLambda', {
      runtime,
      functionName: 'GetProductsByID',
      entry: path.join(__dirname, '../lambda/getProductByID.ts'),
    });

    // POST (/products)
    const postProductLambdaHandler = new NodejsFunction(this, 'PostProduct', {
      runtime,
      functionName: 'PostProduct',
      entry: path.join(__dirname, '../lambda/createProduct.ts'),
    });

    // PUT (/products)
    const putProductLambdaHandler = new NodejsFunction(this, 'PutProduct', {
      runtime,
      functionName: 'PutProduct',
      entry: path.join(__dirname, '../lambda/putProduct.ts'),
    });

    // DELETE (/products/:id)
    const deleteProductByIdLambdaHandler = new NodejsFunction(this, 'DeleteProductByID', {
      runtime,
      functionName: 'DeleteProductByID',
      entry: path.join(__dirname, '../lambda/deleteProductByID.ts'),
    });

    // -----DEV MOCKS:

    // GET (/profile/cart)
    const getProfileCartLambdaHandler = new NodejsFunction(this, 'GetProfileCart', {
      runtime,
      functionName: `GetProfileCart-${stage}`,
      entry: path.join(__dirname, '../lambda/getProfileCart.ts'),
    });

    // PUT (/profile/cart)
    const putProfileCartLambdaHandler = new NodejsFunction(this, 'PutProfileCart', {
      runtime,
      functionName: `PutProfileCart-${stage}`,
      entry: path.join(__dirname, '../lambda/putProfileCart.ts'),
    });

    // GET /order
    const getOrdersLambdaHandler = new NodejsFunction(this, 'GetOrders', {
      runtime,
      functionName: `GetOrders-${stage}`,
      entry: path.join(__dirname, '../lambda/getOrders.ts'),
    });

    // PUT /order
    const putOrderLambdaHandler = new NodejsFunction(this, 'PutOrder', {
      runtime,
      functionName: `PutOrder-${stage}`,
      entry: path.join(__dirname, '../lambda/putOrder.ts'),
    });

    // GET /order/:id
    const getOrderByIdLambdaHandler = new NodejsFunction(this, 'GetOrderById', {
      runtime,
      functionName: `GetOrderById-${stage}`,
      entry: path.join(__dirname, '../lambda/getOrderById.ts'),
    });

    // DELETE /order/:id
    const deleteOrderLambdaHandler = new NodejsFunction(this, 'DeleteOrder', {
      runtime,
      functionName: `DeleteOrder-${stage}`,
      entry: path.join(__dirname, '../lambda/deleteOrder.ts'),
    });

    // PUT /order/:id/status
    const putOrderStatusLambdaHandler = new NodejsFunction(this, 'PutOrderStatus', {
      runtime,
      functionName: `PutOrderStatus-${stage}`,
      entry: path.join(__dirname, '../lambda/putOrderStatus.ts'),
    });

    new DynamoDBTables(this, 'ProductServiceDatabase', {
      lambdas: {
        getProductByID: productLambda,
        getProductsList: productsLambda,
        postProduct: postProductLambdaHandler,
        deleteProductByID: deleteProductByIdLambdaHandler,
        putProduct: putProductLambdaHandler,
        catalogBatchProcess: catalogLambdaHandler,
      },
    });

    // API Gateway endpoints (products)
    const products = api.root.addResource('products');
    const product_id = products.addResource('{id}');

    products.addMethod(httpMethod.GET, new LambdaIntegration(productsLambda));
    product_id.addMethod(httpMethod.GET, new LambdaIntegration(productLambda));
    products.addMethod(httpMethod.PUT, new LambdaIntegration(putProductLambdaHandler));
    product_id.addMethod(httpMethod.DELETE, new LambdaIntegration(deleteProductByIdLambdaHandler));
    products.addMethod(httpMethod.POST, new LambdaIntegration(postProductLambdaHandler));

    // API Gateway endpoints (profile)
    const profile = api.root.addResource('profile');
    const profile_cart = profile.addResource('cart');

    profile_cart.addMethod(httpMethod.GET, new LambdaIntegration(getProfileCartLambdaHandler));
    profile_cart.addMethod(httpMethod.PUT, new LambdaIntegration(putProfileCartLambdaHandler));

    // API Gateway endpoints (order)
    const orders = api.root.addResource('order');
    const order_id = orders.addResource('{id}');
    const order_id_status = order_id.addResource('status');

    orders.addMethod(httpMethod.GET, new LambdaIntegration(getOrdersLambdaHandler));
    orders.addMethod(httpMethod.PUT, new LambdaIntegration(putOrderLambdaHandler));
    order_id.addMethod(httpMethod.GET, new LambdaIntegration(getOrderByIdLambdaHandler));
    order_id.addMethod(httpMethod.DELETE, new LambdaIntegration(deleteOrderLambdaHandler));
    order_id_status.addMethod(httpMethod.PUT, new LambdaIntegration(putOrderStatusLambdaHandler));
  }
}
