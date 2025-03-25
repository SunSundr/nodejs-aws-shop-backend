import { handler } from '../lib/lambda/basicAuthorizer';
import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { generatePolicy } from '../lib/lambda/@generatePolicy';
import { AccessMessage, Effect } from '../lib/lambda/@types';
import { TEST_USER_ENV_KEY } from '../lib/constants';

// let generateErrorCount = 0;
jest.mock('../lib/lambda/@generatePolicy', () => ({
  generatePolicy: jest.fn(),
}));
const mockGeneratePolicy = generatePolicy as jest.MockedFunction<typeof generatePolicy>;

describe('Authorization Handler', () => {
  const mockEvent: APIGatewayTokenAuthorizerEvent = {
    type: 'TOKEN',
    methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path',
    authorizationToken: '',
  };
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env = {
      ADMIN_LOGIN: 'admin',
      ADMIN_PASSWORD: 'admin123',
      TEST_USER_ENV_KEY: 'testUser',
      [TEST_USER_ENV_KEY]: 'testPass',
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('should allow access with correct admin credentials', async () => {
    const token = Buffer.from('admin=admin123').toString('base64');
    mockEvent.authorizationToken = `Basic ${token}`;

    const result = await handler(mockEvent);
    const expectedResult = generatePolicy(
      'admin',
      mockEvent.methodArn,
      Effect.Allow,
      AccessMessage.Allow,
    );

    expect(result).toEqual(expectedResult);
    expect(consoleLogSpy).toHaveBeenCalledWith('Event:', JSON.stringify(mockEvent));
  });

  test('should deny access with incorrect credentials 1', async () => {
    const token = Buffer.from('admin=wrongPass').toString('base64');
    mockEvent.authorizationToken = `Basic ${token}`;

    const result = await handler(mockEvent);
    const expectedResult = generatePolicy('', mockEvent.methodArn, Effect.Deny, AccessMessage.Deny);

    expect(result).toEqual(expectedResult);
  });

  test('should deny access with incorrect credentials 2', async () => {
    const token = Buffer.from('=wrongCredentials').toString('base64');
    mockEvent.authorizationToken = `Basic ${token}`;

    const result = await handler(mockEvent);
    const expectedResult = generatePolicy('', mockEvent.methodArn, Effect.Deny, AccessMessage.Deny);

    expect(result).toEqual(expectedResult);
  });

  test('should handle errors and return deny policy', async () => {
    mockEvent.authorizationToken = 'InvalidToken';
    mockGeneratePolicy.mockImplementationOnce(() => {
      throw new Error('Error Generate Policy');
    });

    const result = await handler(mockEvent);
    const expectedResult = generatePolicy(
      '',
      mockEvent.methodArn,
      Effect.Deny,
      AccessMessage.Error,
    );

    expect(result).toEqual(expectedResult);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
  });

  test('should allow access with correct test user credentials', async () => {
    const token = Buffer.from('testUser=testPass').toString('base64');
    mockEvent.authorizationToken = `Basic ${token}`;
    delete process.env.ADMIN_LOGIN; // Remove admin credentials

    const result = await handler(mockEvent);
    const expectedResult = generatePolicy(
      'testUser',
      mockEvent.methodArn,
      Effect.Allow,
      AccessMessage.Allow,
    );

    expect(result).toEqual(expectedResult);
  });
});
