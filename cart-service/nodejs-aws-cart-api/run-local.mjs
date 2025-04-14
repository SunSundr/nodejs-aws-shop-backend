#!/usr/bin/env node
import { execSync } from 'child_process';

function runDockerContainer() {
  const dockerCommand = [
    'docker run -it --rm',
    '--env-file .env',
    '-p 4000:4000',
    'sunsundr-nodejs-aws-cart-api',
  ].join(' ');

  console.log('Starting Docker container with command:');
  console.log(dockerCommand);

  try {
    execSync(dockerCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error('Docker command failed:', error.message);
    process.exit(1);
  }
}

runDockerContainer();
