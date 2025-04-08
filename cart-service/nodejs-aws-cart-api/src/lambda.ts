import { NestFactory } from '@nestjs/core';
import { configure } from '@codegenie/serverless-express';
import { Context, Handler, Callback } from 'aws-lambda';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

let cachedServer: Handler;

async function bootstrap() {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter);

  // app.enableCors({
  //   origin: (_req, callback) => callback(null, true),
  // });

  await app.init();

  expressApp.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  return configure({
    app: expressApp,
  });
}

export const handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  // console.log('Lambda handler started', { event, context });

  if (!cachedServer) {
    // console.log('Bootstrapping application');
    cachedServer = await bootstrap();
    // console.log('Bootstrap complete');
  }

  try {
    const response = await cachedServer(event, context, callback);
    console.log('Response from server:', response);

    const finalResponse = {
      ...response,
      headers: {},
    };

    console.log('Final response:', finalResponse);
    return finalResponse;
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      headers: {},
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
