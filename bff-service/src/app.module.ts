import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  BATCH_DELAY_MS,
  customKeyv,
  deserializeHttpResponse,
  serializeHttpResponse,
} from './utils/storage';

@Module({
  imports: [
    CacheModule.register({
      stores: [customKeyv],
      ttl: BATCH_DELAY_MS,
      serialize: serializeHttpResponse,
      deserialize: deserializeHttpResponse,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
