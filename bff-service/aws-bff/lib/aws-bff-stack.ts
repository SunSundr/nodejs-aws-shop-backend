import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from "constructs";
import 'dotenv/config';

const ALLOWED_ORIGINS = [
  'https://sunsundr.store', // Route 53
  'https://db5i175ksp8cp.cloudfront.net', // Cloudfront
  'http://localhost:4173', // vite prod server
  'http://localhost:5173', // vite dev server
];

export class AwsBffStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bffDistribution = new cloudfront.Distribution(this, 'BffApiDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(process.env.BFF_URL!, {
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

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'BffCORSHeaders', {
      responseHeadersPolicyName: 'BffCORSHeaders',
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

    bffDistribution.addBehavior(
      '/*',
      new origins.HttpOrigin(process.env.BFF_URL!, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
        customHeaders: {
          'X-Forwarded-Host': `${this.stackName}.cloudfront.net`,
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

    new cdk.CfnOutput(this, 'BffDistribution', {
      value: `https://${bffDistribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });
  }
}
