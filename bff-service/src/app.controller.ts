import { All, Controller, Req, Res, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppRequest } from './types';
import { AxiosResponse } from 'axios';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }

  @All('*')
  async handleRequest(
    @Req() req: AppRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AxiosResponse['data']> {
    return this.appService.handleRequest(req, res);
  }
}
