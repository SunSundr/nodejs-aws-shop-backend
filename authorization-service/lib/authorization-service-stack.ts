import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { CognitoStack } from './cognito/cognito-stack';
import { TEST_USER_ENV_KEY } from './constants';
import 'dotenv/config';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const testUserPassword = process.env[TEST_USER_ENV_KEY];
    if (!testUserPassword) {
      throw new Error(`"${TEST_USER_ENV_KEY}" environment is not defined`);
    }

    new CognitoStack(this, 'CognitoStack');

    const basicAuthorizerLambda = new NodejsFunction(this, 'BasicAuthorizerLambda', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'BasicAuthorizer',
      entry: path.join(__dirname, './lambda/basicAuthorizer.ts'),
      environment: {
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
        ADMIN_LOGIN: process.env.ADMIN_LOGIN || '',
        [TEST_USER_ENV_KEY]: testUserPassword,
      },
    });

    basicAuthorizerLambda.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: ['*'],
      }),
    );

    basicAuthorizerLambda.addPermission('ApiGatewayInvokeFunction', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*`,
    });

    new cdk.CfnOutput(this, 'BasicAuthorizerLambdaArn', {
      value: basicAuthorizerLambda.functionArn,
      exportName: 'BasicAuthorizerLambdaArn',
    });
  }
}
