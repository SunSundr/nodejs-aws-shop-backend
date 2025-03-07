import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import { moveFile } from '../../lib/lambda/utils/moveFile';

const s3Mock = mockClient(S3Client);

describe('moveFile', () => {
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

  it('should move a file successfully', async () => {
    s3Mock.onAnyCommand().resolves({});

    await expect(
      moveFile(new S3Client({}), 'bucket', 'sourceKey', 'destinationKey'),
    ).resolves.not.toThrow();

    expect(consoleLogSpy).toHaveBeenCalledWith('File copied to destinationKey');
    expect(consoleLogSpy).toHaveBeenCalledWith('File deleted from sourceKey');
  });

  it('should handle errors during copy and throw', async () => {
    s3Mock.onAnyCommand().rejects(new Error('Copy failed'));

    await expect(
      moveFile(new S3Client({}), 'bucket', 'sourceKey', 'destinationKey'),
    ).rejects.toThrow('Copy failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error moving file from sourceKey to destinationKey',
    );
  });

  it('should handle errors during delete and rollback', async () => {
    s3Mock
      .onAnyCommand()
      .resolvesOnce({}) // copy success
      .rejectsOnce(new Error('Delete failed')) // delete failure
      .rejectsOnce(new Error('Rollback failed')); // rollback failure (delete)

    await expect(
      moveFile(new S3Client({}), 'bucket', 'sourceKey', 'destinationKey'),
    ).rejects.toThrow('Rollback failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error deleting file from sourceKey:',
      expect.any(Error),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error moving file from sourceKey to destinationKey',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Rollback failed: Error deleting copied file from destinationKey',
    );
  });

  it('should handle errors during delete and successful rollback', async () => {
    s3Mock
      .onAnyCommand()
      .resolvesOnce({}) // copy success
      .rejectsOnce(new Error('Delete failed')) // delete failure
      .resolvesOnce({}); // rollback success

    await expect(
      moveFile(new S3Client({}), 'bucket', 'sourceKey', 'destinationKey'),
    ).rejects.toThrow('Delete failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error moving file from sourceKey to destinationKey',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Rollback successful: File deleted from destinationKey',
    );
  });

  it('should not log if logging is disabled', async () => {
    s3Mock.onAnyCommand().resolves({});

    await expect(
      moveFile(new S3Client({}), 'bucket', 'sourceKey', 'destinationKey', false),
    ).resolves.not.toThrow();

    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
