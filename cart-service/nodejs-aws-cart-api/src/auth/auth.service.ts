import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { User } from 'src/users/entities/user.entity';
// import { contentSecurityPolicy } from 'helmet';
type TokenResponse = {
  token_type: string;
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {
    this.loginJWT = this.loginJWT.bind(this);
    this.loginBasic = this.loginBasic.bind(this);
  }

  async register(payload: User) {
    const user = await this.usersService.findOne(payload.name);

    if (user) {
      throw new BadRequestException('User with such name already exists');
    }

    try {
      const newUser = await this.usersService.createOne(payload);
      return { userId: newUser.id };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async validateUser(name: string, password: string): Promise<User> {
    const user = await this.usersService.findOne(name);
    if (!user) return null;

    if (password === user.password) {
      // /* eslint-disable-next-line */
      // const { password, ...result } = user;
      return user;
    }

    return null;
  }

  login(user: User, type: 'jwt' | 'basic' | 'default'): TokenResponse {
    const LOGIN_MAP = {
      jwt: (user: User) => this.loginJWT(user),
      basic: (user: User) => this.loginBasic(user),
      default: (user: User) => this.loginJWT(user),
    };
    const login = LOGIN_MAP[type];

    return login ? login(user) : LOGIN_MAP.default(user);
  }

  loginJWT(user: User) {
    const payload = { username: user.name, sub: user.id };

    return {
      token_type: 'Bearer',
      access_token: this.jwtService.sign(payload),
    };
  }

  loginBasic(user: User) {
    // const payload = { username: user.name, sub: user.id };
    console.log('loginBasic', user);

    function encodeUserToken(user: User) {
      const { name, password } = user;
      const buf = Buffer.from([name, password].join(':'), 'utf8');

      return buf.toString('base64');
    }

    return {
      token_type: 'Basic',
      access_token: encodeUserToken(user),
    };
  }
}
