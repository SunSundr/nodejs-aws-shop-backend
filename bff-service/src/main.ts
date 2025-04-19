import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// process.env.URL_CART = 'https://d1wr58fh208zzd.cloudfront.net/api/profile/cart';
// process.env.URL_PRODUCTS = 'https://xcunh9a844.execute-api.eu-north-1.amazonaws.com/dev/products';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log(`BFF Service is running on port ${PORT}`);
}

bootstrap();
