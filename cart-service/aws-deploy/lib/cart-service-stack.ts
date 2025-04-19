import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { getRequiredEnvVars } from './utils/getRequiredEnvVars';

const ALLOWED_ORIGINS = [
  'https://sunsundr.store', // Route 53
  'https://db5i175ksp8cp.cloudfront.net', // Cloudfront
  'http://localhost:4173', // vite prod server
  'http://localhost:5173', // vite dev server
];

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
      //handler: 'handler',
      handler: 'index.handler',
      entry: path.join(__dirname, '../../nodejs-aws-cart-api/dist/lambda.js'),
      depsLockFilePath: path.join(__dirname, '../../nodejs-aws-cart-api/package-lock.json'),
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: ['@aws-sdk/*', 'aws-sdk', 'class-transformer', 'class-validator'],
        target: 'node20',
        nodeModules: [
          '@nestjs/core',
          '@nestjs/common',
          '@nestjs/platform-express',
          '@codegenie/serverless-express',
          'reflect-metadata',
          'express',
          //'class-transformer',
          //'class-validator',
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
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
        // maxAge: cdk.Duration.seconds(0),
        // allowCredentials: true,
      },
    });

    cartLambda.node.addDependency(database);

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CartServiceDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(process.env.CART_API_EB_URL as string, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'NestCORSHeaders', {
      responseHeadersPolicyName: 'CORSHeaders',
      corsBehavior: {
        accessControlAllowOrigins: ALLOWED_ORIGINS,
        accessControlAllowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        accessControlAllowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        accessControlAllowCredentials: true,
        accessControlMaxAge: cdk.Duration.seconds(600),
        originOverride: true,
      },
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: "default-src 'self'",
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        strictTransportSecurity: {
          override: true,
          accessControlMaxAge: cdk.Duration.seconds(63072000),
          includeSubdomains: true,
          preload: true,
        },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'X-Custom-Header',
            value: 'Custom Value',
            override: true,
          },
        ],
      },
    });

    distribution.addBehavior(
      '/*',
      new origins.HttpOrigin(process.env.CART_API_EB_URL as string, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
        customHeaders: {
          'X-Forwarded-Host': distribution.distributionDomainName,
          'X-Origin-Verify': 'cloudfront',
        },
      }),
      {
        responseHeadersPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
    );

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'NestUrl', { value: url, description: 'Nest endpoint' });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database endpoint',
    });
  }
}
