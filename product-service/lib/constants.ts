export const EMAILS_TABLE_NAME = 'emails';
export const PRODUCTS_TABLE_NAME = 'products';
export const STOCKS_TABLE_NAME = 'stocks';
export const RESERVED_ID_PREFIX = '7567ec4b-b10c-45c5-9345-fc73c48a80';
export const DEFAULT_CATEGORY = 'default';
export const DEFAULT_EMAIL = 'alex_kov@list.ru';
export const BATCH_SIZE = 5;
export const RESPONSE_ERROR_HEADERS = {
  'Access-Control-Allow-Origin': "'*'",
  'Access-Control-Allow-Headers':
    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
  'Access-Control-Allow-Methods': "'DELETE'",
};
export const ALLOWED_ORIGINS = [
  'https://sunsundr.store', // Route 53
  'https://db5i175ksp8cp.cloudfront.net', // Cloudfront
  'https://github.com/SunSundr', // gh-pages demo (?)
  'http://localhost:4173', // vite prod server
  'http://localhost:5173', // vite dev server
];
