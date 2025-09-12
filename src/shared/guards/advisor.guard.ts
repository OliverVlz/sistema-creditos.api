import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdvisorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    if (user.role !== UserRole.ADVISOR) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
