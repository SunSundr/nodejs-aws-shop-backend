import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import 'dotenv/config';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      ec2.Port.tcp(Number(process.env.POSTGRES_PORT) || 5432),
      'Open PostgreSQL to internet (temporary)',
    );

    const database = new rds.DatabaseInstance(this, 'CartServiceDatabase', {
      instanceIdentifier: process.env.RDS_INSTANCE_IDENTIFIER,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc,
      publiclyAccessible: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO), // Free tier eligible
      databaseName: process.env.POSTGRES_DB_NAME || 'cartServiceDb',
      allocatedStorage: 20, // Maximum free tier storage
      maxAllocatedStorage: 20, // Removed autoscaling
      multiAz: false, // Single AZ for free tier
      credentials: rds.Credentials.fromPassword(
        process.env.POSTGRES_USER || 'postgres',
        cdk.SecretValue.unsafePlainText(process.env.POSTGRES_PASSWORD || 'test_password'),
      ),
      securityGroups: [dbSecurityGroup],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code,
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database endpoint',
    });
  }
}
