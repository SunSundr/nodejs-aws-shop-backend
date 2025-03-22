import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { TEST_USER_ENV_KEY } from '../constants';
import { generatePolicy } from './@generatePolicy';
import { AccessMessage, Effect } from './@types';

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Event: ', JSON.stringify(event));

  try {
    const [, token] = event.authorizationToken.split(' ');
    // Already validated in API Gateway (`identityValidationExpression` / `validationRegex`)
    // if (!token || !authType || authType.toLowerCase() !== 'basic') {
    if (!token) {
      return generatePolicy('', event.methodArn, Effect.Deny, AccessMessage.Deny);
    }

    const buff = Buffer.from(token, 'base64');
    const decodedToken = buff.toString('utf-8');

    const [login, password] = decodedToken.split('=');
    if (!login || !password) {
      return generatePolicy('', event.methodArn, Effect.Deny, AccessMessage.Deny);
    }

    const logins = {
      [process.env.ADMIN_LOGIN || '']: process.env.ADMIN_PASSWORD,
      [TEST_USER_ENV_KEY]: process.env[TEST_USER_ENV_KEY],
    };

    if (logins[login] && logins[login] === password) {
      return generatePolicy(login, event.methodArn, Effect.Allow, AccessMessage.Allow);
    }
    return generatePolicy('', event.methodArn, Effect.Deny, AccessMessage.Deny);
  } catch (error) {
    console.error('Error:', error);
    return generatePolicy('', event.methodArn, Effect.Deny, AccessMessage.Error);
  }
};
