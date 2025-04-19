const { build } = require('esbuild');
const { join } = require('path');

build({
  entryPoints: [join(__dirname, 'dist/main.js')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: join(__dirname, 'dist/index.js'),
  external: [
    '@nestjs/microservices',
    '@nestjs/websockets/socket-module',
    'class-transformer',
    'class-validator',
  ],
  minify: true,
}).catch(() => process.exit(1));
