import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { getRequiredEnvVars } from './utils/getRequiredEnvVars';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env = getRequiredEnvVars();

    const vpc = new ec2.Vpc(this, 'CartServiceVPC', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Allow database access',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // This allows 0.0.0.0/0 (temporary)
      ec2.Port.tcp(Number(env.POSTGRES_PORT)),
      'Open PostgreSQL to internet (temporary)',
    );

    const database = new rds.DatabaseInstance(this, 'CartServiceDatabase', {
      instanceIdentifier: env.RDS_INSTANCE_IDENTIFIER,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      publiclyAccessible: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // Free tier eligible
      databaseName: env.POSTGRES_DB_NAME,
      allocatedStorage: 20, // Maximum free tier storage
      maxAllocatedStorage: 20, // Removed autoscaling
      multiAz: false, // Single AZ for free tier
      credentials: rds.Credentials.fromPassword(
        env.POSTGRES_USER,
        cdk.SecretValue.unsafePlainText(env.POSTGRES_PASSWORD),
      ),
      securityGroups: [dbSecurityGroup],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code,
    });

    // -------------------------------------------------------------
    const cartLambda = new NodejsFunction(this, 'NestLambda', {
      functionName: 'NestLambdaFunction',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../nodejs-aws-cart-api/dist/lambda.js'),
      depsLockFilePath: path.join(__dirname, '../../nodejs-aws-cart-api/package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*', 'aws-sdk', 'class-transformer', 'class-validator'],
        target: 'node20',
        nodeModules: [
          '@nestjs/core',
          '@nestjs/common',
          '@nestjs/platform-express',
          'reflect-metadata',
        ],
        commandHooks: {
          beforeInstall(): string[] {
            return [];
          },
          beforeBundling(): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            const certsSrcPath = path.join(
              inputDir,
              'src',
              'configs',
              'certs',
              'global-bundle.pem',
            );
            const certsDestPath = path.join(outputDir, 'configs', 'certs', 'global-bundle.pem');
            const certsDestDir = path.join(outputDir, 'configs', 'certs');

            return [`mkdir -p "${certsDestDir}"`, `cp "${certsSrcPath}" "${certsDestPath}"`];
          },
        },
      },
      environment: {
        POSTGRES_HOST: database.instanceEndpoint.hostname,
        POSTGRES_USER: env.POSTGRES_USER,
        POSTGRES_PASSWORD: env.POSTGRES_PASSWORD,
        POSTGRES_DB_NAME: env.POSTGRES_DB_NAME,
        POSTGRES_PORT: env.POSTGRES_PORT,
        RDS_INSTANCE_IDENTIFIER: env.RDS_INSTANCE_IDENTIFIER,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const { url } = cartLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      // Possible duplicate headers (commented out):
      // cors: {
      //   allowedOrigins: ['*'],
      //   allowedMethods: [lambda.HttpMethod.ALL],
      //   allowedHeaders: ['*'],
      // },
    });

    cartLambda.node.addDependency(database);

    new cdk.CfnOutput(this, 'NestUrl', { value: url, description: 'Nest endpoint' });
    // -------------------------------------------------------------

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database endpoint',
    });
  }
}
