import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { CaslAbilityFactory } from '../casl/ability-factory';
import { CHECK_ABILITY } from '../validation/check-ability.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private caslAbilityFactory: CaslAbilityFactory,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredAbility = this.reflector.get(
      CHECK_ABILITY,
      context.getHandler(),
    );

    if (!requiredAbility) {
      return true;
    }

    if (!user) {
      return false;
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    return ability.can(requiredAbility.action, requiredAbility.subject);
  }
}
