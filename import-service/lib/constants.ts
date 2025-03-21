export const IMPORT_BUCKET_NAME = 'cdk-rss-import-service-bucket';
export const UPLOADED_KEY = 'uploaded';
export const PARSED_KEY = 'parsed';
export const FAILED_KEY = 'failed';
export const CLOUDFRONT_DOMAIN_NAME = 'CloudfrontURL';
export const MAX_FILE_NAME_LENGTH = 100;
export const ALLOWED_ORIGINS = [
  'https://sunsundr.store', // Route 53
  'https://db5i175ksp8cp.cloudfront.net', // Cloudfront
  'https://github.com/SunSundr', // gh-pages demo (?)
  'http://localhost:4173', // vite prod server
  'http://localhost:5173', // vite dev server
];
export const BATCH_SIZE = 5;
