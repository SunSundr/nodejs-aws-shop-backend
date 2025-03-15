import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const stackOutput = execSync('cdk deploy --outputs-file ./outputs.json', { encoding: 'utf-8' });
console.log(stackOutput);

const outputs = JSON.parse(fs.readFileSync('./outputs.json', 'utf-8'));
const queueUrl = outputs.MyStack.QueueUrlOutput;
const envFilePath = path.join(process.cwd(), '../import-service/.env');

let envFileContent = '';
if (fs.existsSync(envFilePath)) {
  envFileContent = fs.readFileSync(envFilePath, 'utf-8');
}

const lines = envFileContent.split('\n');

let sqsQueueUrlFound = false;
const updatedLines = lines.map((line) => {
  if (line.startsWith('#') || line.trim() === '') {
    return line;
  }

  if (line.startsWith('SQS_QUEUE_URL=')) {
    sqsQueueUrlFound = true;
    return `SQS_QUEUE_URL=${queueUrl}`;
  }

  return line;
});

if (!sqsQueueUrlFound) {
  updatedLines.push(`SQS_QUEUE_URL=${queueUrl}`);
}

const updatedEnvFileContent = updatedLines.join('\n');

fs.writeFileSync(envFilePath, updatedEnvFileContent, { encoding: 'utf-8' });
console.log('Updated .env file with SQS_QUEUE_URL:', queueUrl);

fs.unlinkSync('./outputs.json');
