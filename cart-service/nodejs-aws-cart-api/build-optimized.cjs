// eslint-disable-next-line @typescript-eslint/no-var-requires
const { build } = require('esbuild');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path');

build({
  entryPoints: [join(__dirname, 'src/main.ts')],
  bundle: true, // Включает tree-shaking!
  platform: 'node',
  target: 'node18',
  outfile: join(__dirname, 'dist/main.js'),
  external: [
    '@nestjs/microservices',
    '@nestjs/websockets/socket-module',
    'class-transformer',
    'class-validator',
  ],
  minify: true,
}).catch(() => process.exit(1));

// externalModules: ['@aws-sdk/*', 'aws-sdk', 'class-transformer', 'class-validator'],
// target: 'node20',
// nodeModules: [
//   '@nestjs/core',
//   '@nestjs/common',
//   '@nestjs/platform-express',
//   '@codegenie/serverless-express',
//   'reflect-metadata',
//   'express',
