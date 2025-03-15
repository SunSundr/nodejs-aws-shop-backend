import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ALLOWED_ORIGINS,
  CLOUDFRONT_DOMAIN_NAME,
  IMPORT_BUCKET_NAME,
  UPLOADED_KEY,
} from './constants';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = process.env.STAGE || 'dev';
    const httpMethod = cdk.aws_apigatewayv2.HttpMethod;
    const cloudFrontDomainName = cdk.Fn.importValue(CLOUDFRONT_DOMAIN_NAME);
    const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
    if (!SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL is not defined');
    }
    const SQS_QUEUE_ARN = process.env.SQS_QUEUE_ARN;
    if (!SQS_QUEUE_ARN) {
      throw new Error('SQS_QUEUE_ARN is not defined');
    }

    // Import S3 Bucket:
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
          allowedOrigins: Array.from(
            new Set([
              ...ALLOWED_ORIGINS.map((origin) => origin.trim().toLowerCase()),
              cloudFrontDomainName.trim().toLowerCase(),
            ]),
          ).map((origin) => (origin.startsWith('http') ? origin : `https://${origin}`)),

          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
    });

    // API Gateway
    const api = new RestApi(this, 'ImportServiceAPI', {
      restApiName: 'ImportServiceAPI',
      description: 'API for importing products',
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        //allowMethods: Cors.ALL_METHODS,
      },
    });

    // Import lambda:
    const importProductsFileLambda = new NodejsFunction(this, 'ImportProductsFileLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'ImportProductsFile',
      entry: path.join(__dirname, './lambda/importProductsFile.ts'),
    });

    // Parser lambda:
    const importFileParserLambda = new NodejsFunction(this, 'ImportFileParserLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'ImportFileParser',
      entry: path.join(__dirname, './lambda/importFileParser.ts'),
      environment: {
        SQS_QUEUE_URL,
      },
    });

    // Permissions
    bucket.grantPut(importProductsFileLambda);
    bucket.grantReadWrite(importFileParserLambda);
    importFileParserLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [SQS_QUEUE_ARN],
      }),
    );

    // API Gateway endpoints
    const importResource = api.root.addResource('import');
    importResource.addMethod(httpMethod.GET, new LambdaIntegration(importProductsFileLambda));

    // Notification
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserLambda),
      { prefix: `${UPLOADED_KEY}/` },
    );
  }
}
