import { S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../lib/lambda/importProductsFile';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('../lib/lambda/utils/getUniqObjectKey', () => ({
  getUniqObjectKey: jest.fn(() => 'uploaded/file.csv'),
}));

const s3Mock = mockClient(S3Client);

const getEvent = (fileName: string | null = 'test.csv') =>
  ({
    queryStringParameters: {
      name: fileName,
    },
    headers: [],
  }) as unknown as APIGatewayProxyEvent;

describe('importProductsFile', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    s3Mock.reset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should generate a signed URL successfully', async () => {
    const mockSignedUrl = 'https://mock-signed-url';
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);
    const event = getEvent();
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(`"${mockSignedUrl}"`);
  });

  it('should return 400 if file name is missing', async () => {
    const event = getEvent(null);
    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('File name is required');
  });

  it('should handle errors when generating signed URL', async () => {
    (getSignedUrl as jest.Mock).mockRejectedValue(new Error('Failed to generate URL'));
    const event = getEvent();
    const result = await handler(event);
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating signed URL:', expect.any(Error));
  });
});
