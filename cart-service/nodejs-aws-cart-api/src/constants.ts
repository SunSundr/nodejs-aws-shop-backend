export const JWT_CONFIG = {
  secret: 'secret',
  expiresIn: '12h',
};

export const ALLOWED_ORIGINS = [
  'https://sunsundr.store', // Route 53
  'https://db5i175ksp8cp.cloudfront.net', // Cloudfront
  'http://localhost:4173', // vite prod server
  'http://localhost:5173', // vite dev server
];

export const RESPONSE_ERROR_HEADERS = {
  'Access-Control-Allow-Origin': "'*'",
  'Access-Control-Allow-Headers':
    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
  'Content-Type': 'application/json',
};
