import { Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const APP_CONFIG_SERVICE_TOKEN = 'IAppConfigService';

@Injectable()
export class AppConfigService {
  constructor(readonly configService: ConfigService) {}

  private static instance: AppConfigService;
  static getInstance(configService: ConfigService) {
    return (
      this.instance || (this.instance = new AppConfigService(configService))
    );
  }
  static provider(): Provider {
    return {
      provide: APP_CONFIG_SERVICE_TOKEN,
      inject: [ConfigService],
      useFactory: this.getInstance.bind(this),
    };
  }

  private returnDefault<T>(value: string, result: unknown, defaultValue: T): T {
    if (result === undefined && defaultValue) return defaultValue;
    throw new Error(
      `The environment variable "${value}" is missing or its definition is incorrect`,
    );
  }

  getInteger(value: string, defaultValue?: number, radix = 10): number {
    const result = this.configService.get(value, defaultValue);
    if (typeof result === 'string') return parseInt(result, radix);
    if (typeof result === 'number') return result;
    return this.returnDefault<number>(value, result, defaultValue);
  }

  getFloat(value: string, defaultValue?: number): number {
    const result = this.configService.get(value, defaultValue);
    if (typeof result === 'string') return parseFloat(result);
    if (typeof result === 'number') return result;
    return this.returnDefault<number>(value, result, defaultValue);
  }

  getString(value: string, defaultValue?: string): string {
    const result = this.configService.get(value, defaultValue);
    if (typeof result === 'string') return result;
    return this.returnDefault<string>(value, result, defaultValue);
  }

  getBoolean(value: string, defaultValue?: boolean): boolean {
    const result = this.configService.get(value, defaultValue);
    if (typeof result === 'string') return result === 'true';
    if (typeof result === 'boolean') return result;
    return this.returnDefault<boolean>(value, result, defaultValue);
  }
}
