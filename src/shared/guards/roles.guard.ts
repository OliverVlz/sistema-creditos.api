import {
  SetMetadata,
  UseGuards,
  applyDecorators,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { User } from 'src/identity/domain/user.model';
import { UserRole } from '../enums';

const REQUESTED_ROLES = 'REQUESTED_ROLES';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(REQUESTED_ROLES, context.getHandler());
    
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return RolesGuard.matchAnyRole(roles, user as User);
  }

  static matchAnyRole(requestedRoles: UserRole[], user: User): boolean {
    return requestedRoles.some(role => user.role === role);
  }
}

export const Roles = (...roles: UserRole[]) =>
  applyDecorators(UseGuards(RolesGuard), SetMetadata(REQUESTED_ROLES, roles));
