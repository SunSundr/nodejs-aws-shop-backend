import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as brandingConfig from './branding-style.json';
import { CfnManagedLoginBranding } from 'aws-cdk-lib/aws-cognito';
import { CALLBACK_URLS, CLOUDFRONT_DOMAIN_NAME } from '../constants';

export class CognitoStack extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const logoutUrls = Array.from(
      new Set([
        ...CALLBACK_URLS.map((url) => url.trim().toLowerCase()),
        cdk.Fn.importValue(CLOUDFRONT_DOMAIN_NAME).trim().toLowerCase(),
      ]),
    ).map((url) => (url.startsWith('http') ? url : `https://${url}`));

    const callbackUrls = logoutUrls.map((url) => `${url}/login`);

    this.userPool = new cognito.UserPool(this, 'StoreUserPool', {
      userPoolName: 'StoreUserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        admin: new cognito.BooleanAttribute({ mutable: true }),
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // signInCaseSensitive: false, // Makes email case-insensitive
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // const manageProductsScope: cognito.ResourceServerScope = {
    //   scopeName: 'manage:products',
    //   scopeDescription: 'Ability to manage products',
    // };

    // const resourceServer = new cognito.UserPoolResourceServer(this, 'ResourceServer', {
    //   identifier: 'products',
    //   userPool: this.userPool,
    //   scopes: [manageProductsScope],
    // });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'UserPoolClientSunSundrStore',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          // cognito.OAuthScope.resourceServer(resourceServer, manageProductsScope),
        ],
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      preventUserExistenceErrors: true,
    });

    this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: 'sunsundr-auth',
      },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    new CfnManagedLoginBranding(this, 'MyManagedLoginBranding', {
      userPoolId: this.userPool.userPoolId,
      clientId: this.userPoolClient.userPoolClientId,
      settings: brandingConfig.Settings,
      assets: [],
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'UserPoolDomainName', {
      value: this.userPoolDomain.domainName,
    });

    // sign in url example:
    new cdk.CfnOutput(this, 'UserPoolSignInUrl', {
      value: this.userPoolDomain.signInUrl(this.userPoolClient, {
        redirectUri: callbackUrls[0],
        signInPath: '/oauth2/authorize',
      }),
    });
  }
}
