import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { getCertificate } from './getCertificate';
import 'dotenv/config';

export async function getClient(): Promise<Client | null> {
  try {
    const outputPath = path.join(__dirname, '../../cdk-outputs.json');
    if (!fs.existsSync(outputPath)) throw new Error('cdk-outputs.json not found');
    const outputs = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    const stackOutputs = outputs['CartServiceStack'];

    const certPath = await getCertificate();
    const client = new Client({
      host: stackOutputs['DbEndpoint'],
      port: Number(process.env.POSTGRES_PORT),
      database: process.env.POSTGRES_DB_NAME,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString(),
      },
    });
    return client;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
