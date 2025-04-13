import {
  Controller,
  Get,
  Request,
  Post,
  UseGuards,
  HttpStatus,
  Body,
  HttpCode,
  Inject,
} from '@nestjs/common';
import {
  LocalAuthGuard,
  AuthService,
  // JwtAuthGuard,
  BasicAuthGuard,
} from './auth';
import { AppRequest } from './shared';
import { User } from './users/entities/user.entity';

@Controller()
export class AppController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Get(['', 'ping'])
  healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('api/auth/register')
  @HttpCode(HttpStatus.CREATED)
  // TODO ADD validation
  async register(@Body() body: User) {
    return await this.authService.register(body);
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('api/auth/login')
  async login(@Request() req: AppRequest) {
    const token = this.authService.login(req.user, 'basic');

    return token;
  }

  @UseGuards(BasicAuthGuard)
  @Get('api/profile')
  async getProfile(@Request() req: AppRequest) {
    /* eslint-disable-next-line*/
    const { password, ...result } = req.user;
    return {
      user: result,
    };
  }
}
