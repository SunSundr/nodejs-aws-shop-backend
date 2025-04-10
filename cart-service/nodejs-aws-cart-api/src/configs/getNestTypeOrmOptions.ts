import * as fs from 'fs';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigService } from 'src/app.config.service';
import { Cart } from 'src/cart/entities/cart.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { getCertificate } from './getCertificate';

export const getNestTypeOrmOptions = async (
  appConfigService: AppConfigService,
): Promise<TypeOrmModuleOptions> => {
  const certPath = await getCertificate();
  return {
    type: 'postgres',
    host: appConfigService.getString('POSTGRES_HOST'),
    port: appConfigService.getInteger('POSTGRES_PORT'),
    username: appConfigService.getString('POSTGRES_USER'),
    password: appConfigService.getString('POSTGRES_PASSWORD'),
    database: appConfigService.getString('POSTGRES_DB_NAME'),
    entities: [Cart, CartItem, Order, User],
    logging: true,
    autoLoadEntities: true,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(certPath).toString(),
    },
    extra: {
      max: 1, // Reduce pool size for Lambda
      connectionTimeoutMillis: 10000,
      query_timeout: 4000,
      statement_timeout: 4000,
      keepalive: true,
      keepaliveInitialDelayMillis: 5000,
    },
  };
};
