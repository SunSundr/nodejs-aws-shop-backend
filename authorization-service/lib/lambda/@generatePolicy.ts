import { APIGatewayAuthorizerResult, StatementEffect } from 'aws-lambda';

export const generatePolicy = (
  principalId: string,
  resource: string,
  effect: StatementEffect,
  message: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: { message },
  };
};
