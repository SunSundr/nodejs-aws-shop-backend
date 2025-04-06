import { NestFactory } from '@nestjs/core';
import { configure } from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ALLOWED_ORIGINS, RESPONSE_ERROR_HEADERS } from './constants';
// import cors from 'express';

type LambdaFunctionUrlEvent = {
  version: string;
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
  requestContext: {
    accountId: string;
    apiId: string;
    domainName: string;
    domainPrefix: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    requestId: string;
    routeKey: string;
    stage: string;
    time: string;
    timeEpoch: number;
  };
  body: string;
  isBase64Encoded: boolean;
};

type ResponseHeaders = {
  [header: string]: boolean | number | string;
};

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cors inside nest:
  // app.enableCors({
  //  origin: (_req, callback) => callback(null, true),
  // });

  // for preflight:
  //app.use(cors());

  app.use(helmet());

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return configure({ app: expressApp });
}

export const handler = async (
  event: LambdaFunctionUrlEvent,
  context: Context,
  callback: Callback,
) => {
  try {
    if (!server) {
      console.log('Starting the application...');
      server = await bootstrap();
    }
    const response = await server(event, context, callback);

    return {
      ...response,
      headers: {
        ...getHeaders([event.requestContext?.http?.method], event.headers),
        ...(response.headers || {}),
      },
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: RESPONSE_ERROR_HEADERS,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function getHeaders(
  methods: string[] = [],
  headers: ResponseHeaders | undefined,
) {
  const origin = headers ? headers['origin'] || headers['Origin'] : '*';
  return {
    'Access-Control-Allow-Origin':
      origin && ALLOWED_ORIGINS.includes(String(origin)) ? origin : '',
    'Access-Control-Allow-Methods': methods.length
      ? methods.join(',')
      : 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
