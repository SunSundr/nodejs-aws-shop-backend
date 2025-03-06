import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HttpMethod } from './@types';
import { proxyResult } from './@proxyResult';
import { errorResult } from './@errorResult';
import { IMPORT_BUCKET_NAME, UPLOADED_KEY } from '../constants';

const s3Client = new S3Client();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return proxyResult(400, HttpMethod.GET, { message: 'File name is required' });
    }

    const putObjectCommand = new PutObjectCommand({
      Bucket: IMPORT_BUCKET_NAME,
      Key: `${UPLOADED_KEY}/${fileName}`,
      ContentType: 'text/csv',
    });

    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 60,
    });

    return proxyResult(200, HttpMethod.GET, signedUrl);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return errorResult(error, HttpMethod.GET);
  }
};
