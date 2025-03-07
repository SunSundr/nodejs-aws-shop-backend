import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { S3EventRecord, Context } from 'aws-lambda';
import { Readable } from 'stream';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../lib/lambda/importFileParser';
import { sdkStreamMixin } from '@smithy/util-stream';

const s3Mock = mockClient(S3Client);
type SdkReadableStream = ReturnType<typeof sdkStreamMixin>;

const getS3Event = (key = 'uploaded/file.csv') => ({
  Records: [
    {
      s3: {
        bucket: { name: 'bucket' },
        object: { key },
      },
    } as S3EventRecord,
  ],
});

const getStream = (content: string) => {
  const stream = new Readable({
    read() {
      this.push(content);
      this.push(null);
    },
  });
  return sdkStreamMixin(stream);
};

const standardErrorResult = (objectKey: string, bucketName: string) => {
  return [
    `Error processing file ${objectKey}:`,
    expect.objectContaining({
      error: expect.any(Error),
      bucketName,
      objectKey,
    }),
  ];
};

describe('importFileParser', () => {
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

  it('should process a file successfully', async () => {
    const sdkStream = getStream(`name,description,price\nProduct 1,Description 1,10.99`);
    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
    const event = getS3Event();

    await handler(event, {} as Context);

    expect(consoleLogSpy).toHaveBeenCalledWith('Parsed row:', {
      name: 'Product 1',
      description: 'Description 1',
      price: '10.99',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Parsing is ended');
  });

  it('should skip files not in the uploaded folder', async () => {
    const event = getS3Event('other/file.csv');

    await handler(event, {} as Context);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'File other/file.csv is not in the uploaded folder. Skipping.',
    );
  });

  it('should handle errors when reading file from S3', async () => {
    s3Mock.on(GetObjectCommand).rejects(new Error('Failed to read file'));
    const event = getS3Event();

    await handler(event, {} as Context);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      ...standardErrorResult('uploaded/file.csv', 'bucket'),
    );
  });

  it('should handle errors when the response body is not readable', async () => {
    s3Mock.on(GetObjectCommand).resolves({ Body: (() => {}) as unknown as SdkReadableStream });
    const event = getS3Event();

    await handler(event, {} as Context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      ...standardErrorResult('uploaded/file.csv', 'bucket'),
    );
  });

  it('should handle errors when parsing CSV', async () => {
    const sdkStream = getStream(`name,description,price\nProduct 1,Description 1\u0001,10.99`);
    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
    const event = getS3Event();

    await handler(event, {} as Context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      ...standardErrorResult('uploaded/file.csv', 'bucket'),
    );
  });

  it('should handle errors when moving file', async () => {
    const sdkStream = getStream(`name,description,price\nProduct 1,Description 1,10.99`);
    s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
    s3Mock.onAnyCommand().rejects(new Error('Failed to move file'));
    const event = getS3Event();

    await handler(event, {} as Context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      ...standardErrorResult('uploaded/file.csv', 'bucket'),
    );
  });
});
