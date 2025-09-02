import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '../enums';

@Injectable()
export class IsCustomerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return user.role === UserRole.Customer;
  }
}
