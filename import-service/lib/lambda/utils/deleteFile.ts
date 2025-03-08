import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { OperationResult } from '../@types';

export async function deleteFile(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string,
  logging = true,
): Promise<OperationResult> {
  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    await s3Client.send(deleteObjectCommand);
    if (logging) console.log(`File deleted from ${objectKey}`);
    return { status: true };
  } catch (error) {
    console.error(`Error deleting file from ${objectKey}:`, error);
    return { status: false, error };
  }
}
