import 'dotenv/config';

type EnvVariables = {
  POSTGRES_PORT: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB_NAME: string;
  RDS_INSTANCE_IDENTIFIER: string;
};

export function getRequiredEnvVars(): EnvVariables {
  const requiredVars = [
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB_NAME',
    'RDS_INSTANCE_IDENTIFIER',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    POSTGRES_PORT: process.env.POSTGRES_PORT!,
    POSTGRES_USER: process.env.POSTGRES_USER!,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
    POSTGRES_DB_NAME: process.env.POSTGRES_DB_NAME!,
    RDS_INSTANCE_IDENTIFIER: process.env.RDS_INSTANCE_IDENTIFIER!,
  };
}
