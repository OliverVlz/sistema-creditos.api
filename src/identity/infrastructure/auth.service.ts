import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';

import { HashService } from 'src/shared/hash';

import { User } from '../domain/user.model';
import { User as UserEntity } from './entity/user.entity';

import { UserRepository } from './repositories/user.repository';
import { LoginDto } from './dto/login.dto';

type ValidationOptions = {
  generateToken?: boolean;
};

@Injectable()
export class AuthService {
  private readonly jwtOptions: JwtModuleOptions;
  constructor(
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {
    this.jwtOptions = this.configService.get('jwt');
  }

  async validateUser(
    { email, password }: LoginDto,
    { generateToken = false }: ValidationOptions = {},
  ) {
    let user: UserEntity;
    if (email) {
      user = await this.userRepository.findByEmail(email);
    } else {
      return this.denySignIn();
    }

    if (!user) {
      return this.denySignIn();
    }

    if (!(await this.arePasswordsEquals(user, password))) {
      return this.denySignIn();
    }

    return {
      token: generateToken
        ? await this.generateToken({ userId: user.id })
        : undefined,
      user: User.fromModel(user).getUserInfo(),
    };
  }

  private async arePasswordsEquals(user: UserEntity, password: string) {
    return this.hashService.compare(password, user.password);
  }

  async generateToken(
    data: string | object | Buffer,
    options?: JwtSignOptions,
  ) {
    let payload: object | Buffer;

    if (typeof data === 'string') {
      payload = { data }; // Si es un string, lo conviertes en un objeto.
    } else {
      payload = data;
    }

    return this.jwtService.signAsync(payload, {
      secret: this.jwtOptions.secret,
      ...this.jwtOptions.signOptions,
      ...options,
    });
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new NotAcceptableException('Invalid or expired token');
    }
  }

  async decodeToken<Type = string | { [key: string]: any }>(token: string) {
    return this.jwtService.decode(token) as Type;
  }

  private denySignIn(): never {
    throw new UnauthorizedException();
  }
}
