import { S3Event, Context, S3EventRecord } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { BATCH_SIZE, FAILED_KEY, PARSED_KEY, UPLOADED_KEY } from '../constants';
import { getUniqObjectKey } from './utils/getUniqObjectKey';
import { moveFile } from './utils/moveFile';
import { withRetry } from './utils/withRetry';

const s3Client = new S3Client();
const sqsClient = new SQSClient();

export const handler = async (event: S3Event, _context: Context): Promise<void> => {
  const queueUrl = process.env.SQS_QUEUE_URL;
  if (!queueUrl) {
    throw new Error('SQS_QUEUE_URL environment variable is not set');
  }
  await Promise.all(
    event.Records.map(async (record) => {
      try {
        await processFile(record.s3.bucket.name, record.s3.object.key, queueUrl);
      } catch (error) {
        await handleFileError(record, error);
      }
    }),
  );
};

export const createSQSItems = async (queueUrl: string, data: unknown[]) => {
  console.log('Creating SQS items batch:', data);

  const sqsSendMessageBatchs: SendMessageBatchCommand[] = [];

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    const sqsSendMessageBatch = new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: batch.map((item) => ({
        Id: randomUUID(),
        MessageBody: JSON.stringify(item),
      })),
    });

    sqsSendMessageBatchs.push(sqsSendMessageBatch);
  }
  await Promise.all(
    sqsSendMessageBatchs.map(async (batchCommand) => {
      return sqsClient
        .send(batchCommand)
        .then((response) => {
          if (response.Failed && response.Failed.length > 0) {
            console.error('Some messages failed to send:', response.Failed);
          } else if (response.Successful && response.Successful.length > 0) {
            console.log('Messages sent successfully:', response.Successful);
          }
          return response;
        })
        .catch((err) => {
          console.error('Error sending batch:', err);
        });
    }),
  );
};

async function processFile(bucketName: string, objectKey: string, queueUrl: string): Promise<void> {
  if (!objectKey.startsWith(`${UPLOADED_KEY}/`)) {
    console.log(`File ${objectKey} is not in the uploaded folder. Skipping.`);
    return;
  }

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const response = await s3Client.send(getObjectCommand);

  if (!(response.Body instanceof Readable)) {
    throw new Error('Unable to read file stream from S3');
  }

  const stream = response.Body.pipe(csvParser({ strict: true }));

  const rows: unknown[] = [];
  for await (const row of stream) {
    for (const key in row) {
      /* eslint-disable-next-line no-control-regex */
      if (/[\x00-\x08\x0E-\x1F]/.test(row[key])) {
        throw new Error(`Invalid characters found in row: ${row[key]}`);
      }
    }
    rows.push(row);
  }
  await createSQSItems(queueUrl, rows);

  await withRetry(() =>
    moveFile(s3Client, bucketName, objectKey, getUniqObjectKey(objectKey, PARSED_KEY)),
  );
}

async function handleFileError(record: S3EventRecord, error: unknown): Promise<void> {
  console.error(`Error processing file ${record.s3.object.key}:`, {
    error,
    bucketName: record.s3.bucket.name,
    objectKey: record.s3.object.key,
  });

  try {
    await withRetry(() =>
      moveFile(
        s3Client,
        record.s3.bucket.name,
        record.s3.object.key,
        getUniqObjectKey(record.s3.object.key, FAILED_KEY),
      ),
    );
  } catch (moveError) {
    console.error('Error moving file to failed folder:', moveError);
  }
}
