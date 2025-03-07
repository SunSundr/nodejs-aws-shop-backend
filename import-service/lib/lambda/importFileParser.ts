import { S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { getUniqObjectKey } from './utils/getUniqObjectKey';
import { moveFile } from './utils/moveFile';
import { FAILED_KEY, PARSED_KEY, UPLOADED_KEY } from '../constants';

const s3Client = new S3Client({});

export const handler = async (event: S3Event, _context: Context): Promise<void> => {
  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;

      if (!objectKey.startsWith(`${UPLOADED_KEY}/`)) {
        console.log(`File ${objectKey} is not in the uploaded folder. Skipping.`);
        return;
      }

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const response = await s3Client.send(getObjectCommand);

      if (response.Body instanceof Readable) {
        const stream = response.Body.pipe(csvParser());

        for await (const row of stream) {
          console.log('Parsed row:', row);
        }

        console.log('Parsing is ended');

        await moveFile(s3Client, bucketName, objectKey, getUniqObjectKey(objectKey, PARSED_KEY));
      } else {
        throw new Error('Unable to read file stream from S3');
      }
    } catch (error) {
      console.error(`Error processing record for object ${record.s3.object.key}:`, error);
      try {
        const objectKey = record.s3.object.key;
        await moveFile(
          s3Client,
          record.s3.bucket.name,
          objectKey,
          getUniqObjectKey(objectKey, FAILED_KEY),
        );
      } catch (moveError) {
        console.error(`Error`, moveError);
      }
    }
  }
};
