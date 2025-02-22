import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const stage = process.env.STAGE || 'dev';
    const httpMethod = cdk.aws_apigatewayv2.HttpMethod;

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
      runtime: Runtime.NODEJS_22_X,
      functionName: 'GetProductList',
      entry: path.join(__dirname, '../lambda/getProductList.ts'),
      // bundling: {
      //   minify: true,
      //   target: 'node22',
      // },
    });

    // GET (/products/:id)
    const productLambda = new NodejsFunction(this, 'ProductLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'GetProductsByID',
      entry: path.join(__dirname, '../lambda/getProductByID.ts'),
    });

    // PUT (/products)
    const putProductLambdaHandler = new NodejsFunction(this, 'PutProduct', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `PutProduct-${stage}`,
      entry: path.join(__dirname, '../lambda/putProduct.ts'),
    });

    // DELETE (/products/:id)
    const deleteProductByIdLambdaHandler = new NodejsFunction(this, 'DeleteProductByID', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `DeleteProductByID-${stage}`,
      entry: path.join(__dirname, '../lambda/deleteProductByID.ts'),
    });

    // GET (/profile/cart)
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

    // API Gateway endpoints (products)
    const products = api.root.addResource('products');
    const product_id = products.addResource('{id}');

    products.addMethod(httpMethod.GET, new LambdaIntegration(productsLambda));
    product_id.addMethod(httpMethod.GET, new LambdaIntegration(productLambda));
    products.addMethod(httpMethod.PUT, new LambdaIntegration(putProductLambdaHandler));
    product_id.addMethod(httpMethod.DELETE, new LambdaIntegration(deleteProductByIdLambdaHandler));

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
