import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { AuthService } from '../auth.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, pass: string): Promise<any> {
    console.log('BasicStrategy');
    const user = await this.authService.validateUser(username, pass);

    if (!user) {
      throw new UnauthorizedException();
    }
    /* eslint-disable-next-line */
    const { password, ...result } = user;

    return user;
  }
}
