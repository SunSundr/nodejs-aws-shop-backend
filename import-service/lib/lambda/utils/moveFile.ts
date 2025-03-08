import { S3Client } from '@aws-sdk/client-s3';
import { copyFile } from './copyFile';
import { deleteFile } from './deleteFile';

export async function moveFile(
  s3Client: S3Client,
  bucketName: string,
  sourceKey: string,
  destinationKey: string,
  logging = true,
): Promise<void> {
  const copyResult = await copyFile(s3Client, bucketName, sourceKey, destinationKey, logging);
  const deleteResult = copyResult.status
    ? await deleteFile(s3Client, bucketName, sourceKey, logging)
    : { status: false };

  if (!copyResult.status || !deleteResult.status) {
    console.error(`Error moving file from ${sourceKey} to ${destinationKey}`);
    if (copyResult.status) {
      const rollbackResult = await deleteFile(s3Client, bucketName, destinationKey, false);
      if (!rollbackResult.status) {
        console.error(`Rollback failed: Error deleting copied file from ${destinationKey}`);
        throw rollbackResult.error;
      } else {
        console.log(`Rollback successful: File deleted from ${destinationKey}`);
      }
      throw deleteResult.error;
    }

    throw copyResult.error;
  }
}
