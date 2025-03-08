import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { OperationResult } from '../@types';

export async function copyFile(
  s3Client: S3Client,
  bucketName: string,
  sourceKey: string,
  destinationKey: string,
  logging = true,
): Promise<OperationResult> {
  try {
    const copyObjectCommand = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    await s3Client.send(copyObjectCommand);
    if (logging) console.log(`File copied to ${destinationKey}`);
    return { status: true };
  } catch (error) {
    console.error(`Error copying file from ${sourceKey} to ${destinationKey}:`, error);
    return { status: false, error };
  }
}
