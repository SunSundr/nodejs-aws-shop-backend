import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { copyFile } from '../../lib/lambda/utils/copyFile';

const s3Mock = mockClient(S3Client);

describe('copyFile', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    s3Mock.reset();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should copy a file successfully', async () => {
    s3Mock.on(CopyObjectCommand).resolves({});
    const destinationKey = 'destinationKey';

    const result = await copyFile(new S3Client({}), 'bucket', 'sourceKey', destinationKey);

    expect(result.status).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(`File copied to ${destinationKey}`);
  });

  it('should handle errors when copying a file', async () => {
    s3Mock.on(CopyObjectCommand).rejects(new Error('Copy failed'));
    const sourceKey = 'sourceKey';
    const destinationKey = 'destinationKey';

    const result = await copyFile(new S3Client({}), 'bucket', sourceKey, destinationKey);

    expect(result.status).toBe(false);
    expect(result.error).toBeDefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error copying file from ${sourceKey} to ${destinationKey}:`,
      expect.any(Error),
    );
  });

  it('should not log if logging is disabled', async () => {
    s3Mock.on(CopyObjectCommand).resolves({});

    const result = await copyFile(new S3Client({}), 'bucket', 'sourceKey', 'objectKey', false);

    expect(result.status).toBe(true);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
