import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AuthService } from '../../infrastructure/auth.service';

import { LoginQuery } from './login.query';

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery> {
  constructor(private readonly authService: AuthService) {}

  execute(query: LoginQuery) {
    return this.authService.validateUser(query, {
      generateToken: true,
    });
  }
}
