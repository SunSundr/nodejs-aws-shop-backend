import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = process.env.STAGE || 'dev';

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

    // GET (/products)
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/products
    const productsLambda = new NodejsFunction(this, 'ProductsLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'GetProductList',
      entry: path.join(__dirname, '../lambda/getProductList.ts'),
      //handler: 'handler',
      // code: lambda.Code.fromAsset('lambda'),
      // handler: 'getProductList.handler',
      // bundling: {
      //   minify: true,
      //   target: 'node22',
      // },
    });

    // GET (/products/:id)
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/products/7567ec4b-b10c-48c5-9345-fc73348a80a1
    const productLambda = new NodejsFunction(this, 'ProductLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'GetProductsByID',
      entry: path.join(__dirname, '../lambda/getProductByID.ts'),
      // handler: 'handler',
      // code: lambda.Code.fromAsset('lambda'),
      // handler: 'getProductByID.handler',
      // bundling: {
      //   minify: true,
      //   target: 'node22',
      // },
    });

    // PUT (/products)
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/products
    const putProductLambdaHandler = new NodejsFunction(this, 'PutProduct', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `PutProduct-${stage}`,
      entry: path.join(__dirname, '../lambda/putProduct.ts'),
    });

    // DELETE (/products/:id)
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/products/7567ec4b-b10c-48c5-9345-fc73348a80a1
    const deleteProductByIdLambdaHandler = new NodejsFunction(this, 'DeleteProductByID', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `DeleteProductByID-${stage}`,
      entry: path.join(__dirname, '../lambda/deleteProductByID.ts'),
    });

    //---------------------------------------------------------------------------------
    // GET (/profile/cart)
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/profile/cart
    const getProfileCartLambdaHandler = new NodejsFunction(this, 'GetProfileCart', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `GetProfileCart-${stage}`,
      entry: path.join(__dirname, '../lambda/getProfileCart.ts'),
    });

    // PUT (/profile/cart)
    const putProfileCartLambdaHandler = new NodejsFunction(this, 'PutProfileCart', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `PutProfileCart-${stage}`,
      entry: path.join(__dirname, '../lambda/putProfileCart.ts'),
    });

    // GET /order
    // https://1gegmvjyg6.execute-api.eu-north-1.amazonaws.com/dev/order
    const getOrdersLambdaHandler = new NodejsFunction(this, 'GetOrders', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `GetOrders-${stage}`,
      entry: path.join(__dirname, '../lambda/getOrders.ts'),
    });

    // PUT /order
    const putOrderLambdaHandler = new NodejsFunction(this, 'PutOrder', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `PutOrder-${stage}`,
      entry: path.join(__dirname, '../lambda/putOrder.ts'),
    });

    // GET /order/:id
    const getOrderByIdLambdaHandler = new NodejsFunction(this, 'GetOrderById', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `GetOrderById-${stage}`,
      entry: path.join(__dirname, '../lambda/getOrderById.ts'),
    });

    // DELETE /order/:id
    const deleteOrderLambdaHandler = new NodejsFunction(this, 'DeleteOrder', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `DeleteOrder-${stage}`,
      entry: path.join(__dirname, '../lambda/deleteOrder.ts'),
    });

    // PUT /order/:id/status
    const putOrderStatusLambdaHandler = new NodejsFunction(this, 'PutOrderStatus', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `PutOrderStatus-${stage}`,
      entry: path.join(__dirname, '../lambda/putOrderStatus.ts'),
    });

    // API Gateway endpoints
    const products = api.root.addResource('products');
    const product_id = products.addResource('{id}');

    // API Gateway methods & integration
    products.addMethod('GET', new LambdaIntegration(productsLambda));
    product_id.addMethod('GET', new LambdaIntegration(productLambda));
    products.addMethod('PUT', new LambdaIntegration(putProductLambdaHandler));
    product_id.addMethod('DELETE', new LambdaIntegration(deleteProductByIdLambdaHandler));

    const profile = api.root.addResource('profile');
    const profile_cart = profile.addResource('cart');

    profile_cart.addMethod('GET', new LambdaIntegration(getProfileCartLambdaHandler));
    profile_cart.addMethod('PUT', new LambdaIntegration(putProfileCartLambdaHandler));

    const orders = api.root.addResource('order');
    const order_id = orders.addResource('{id}');
    const order_status = order_id.addResource('status');

    orders.addMethod('GET', new LambdaIntegration(getOrdersLambdaHandler));
    orders.addMethod('PUT', new LambdaIntegration(putOrderLambdaHandler));

    order_id.addMethod('GET', new LambdaIntegration(getOrderByIdLambdaHandler));
    order_id.addMethod('DELETE', new LambdaIntegration(deleteOrderLambdaHandler));

    order_status.addMethod('PUT', new LambdaIntegration(putOrderStatusLambdaHandler));
  }
}
