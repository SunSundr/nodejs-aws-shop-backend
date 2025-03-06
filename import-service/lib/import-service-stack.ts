import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CLOUDFRONT_DOMAIN_NAME, IMPORT_BUCKET_NAME } from './constants';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = process.env.STAGE || 'dev';
    const httpMethod = cdk.aws_apigatewayv2.HttpMethod;
    const cloudFrontDomainName = cdk.Fn.importValue(CLOUDFRONT_DOMAIN_NAME);

    const bucket = new s3.Bucket(this, 'ImportServiceBucket', {
      bucketName: IMPORT_BUCKET_NAME,
      // versioned: false,
      // publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: [
            'http://localhost:5173',
            'http://sunsundr.store',
            `https://${cloudFrontDomainName}`,
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
    });

    const importProductsFileLambda = new NodejsFunction(this, 'ImportProductsFileLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'ImportProductsFile',
      entry: path.join(__dirname, './lambda/importProductsFile.ts'),
      // bundling: {
      //   minify: true,
      //   target: 'node22',
      // },
    });

    bucket.grantPut(importProductsFileLambda);

    // API Gateway
    const api = new RestApi(this, 'ImportServiceAPI', {
      restApiName: 'ImportServiceAPI',
      description: 'API for importing products',
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        // allowMethods: Cors.ALL_METHODS,
      },
    });

    const importResource = api.root.addResource('import');
    importResource.addMethod(httpMethod.GET, new LambdaIntegration(importProductsFileLambda));
  }
}
