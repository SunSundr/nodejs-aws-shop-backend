import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from "constructs";
import 'dotenv/config';

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
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: new cloudfront.OriginRequestPolicy(this, 'OriginRequestPolicy', {
          headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(),
          queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
          cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        }),
      },
      enabled: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'BffDistribution', {
      value: bffDistribution.distributionDomainName,
      description: 'BffApiDistribution Domain Name',
    });
  
  }
}
