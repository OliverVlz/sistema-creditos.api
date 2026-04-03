import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { User } from 'src/identity/domain/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepository: UserRepository,
    protected readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    this.validateExpiration(payload.exp);

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('INVALID_SESSION_USER');
    }

    return User.fromModel(user);
  }

  private validateExpiration(expirationDate: number) {
    if (Date.now() >= expirationDate * 1000) {
      throw new UnauthorizedException('SESSION_TOKEN_EXPIRED');
    }
  }
}
