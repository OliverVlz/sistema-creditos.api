import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/shared/enums';

@Injectable()
export class AdminOrAdvisorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acceso denegado');
    }

    const allowedRoles = [UserRole.ADMIN, UserRole.ASESOR];
    
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Permisos insuficientes');
    }

    return true;
  }
}
