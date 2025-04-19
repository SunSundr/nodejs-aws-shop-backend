import { All, Controller, Request, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppRequest } from './types';
import { AxiosResponse } from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }

  @All('*')
  async handleRequest(@Request() req: AppRequest): Promise<AxiosResponse['data']> {
    return this.appService.handleRequest(req);
  }
}
