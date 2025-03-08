import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { deleteFile } from '../../lib/lambda/utils/deleteFile';

const s3Mock = mockClient(S3Client);

describe('deleteFile', () => {
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

  it('should delete a file successfully', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});

    const result = await deleteFile(new S3Client({}), 'bucket', 'objectKey');
    expect(result.status).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith('File deleted from objectKey');
  });

  it('should handle errors when deleting a file', async () => {
    s3Mock.on(DeleteObjectCommand).rejects(new Error('Delete failed'));

    const result = await deleteFile(new S3Client({}), 'bucket', 'objectKey');

    expect(result.status).toBe(false);
    expect(result.error).toBeDefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error deleting file from objectKey:',
      expect.any(Error),
    );
  });

  it('should not log if logging is disabled', async () => {
    s3Mock.on(DeleteObjectCommand).resolves({});
    const result = await deleteFile(new S3Client({}), 'bucket', 'objectKey', false);

    expect(result.status).toBe(true);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
