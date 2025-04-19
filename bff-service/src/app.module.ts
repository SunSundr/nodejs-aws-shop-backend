import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      store: 'memory',
      max: 100,
      ttl: 120000, // 2 minutes
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
