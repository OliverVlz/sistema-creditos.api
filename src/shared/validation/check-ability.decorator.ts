// src/guards/ability.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Actions } from '../casl/ability-factory';
import { Subjects } from '../casl/ability-factory';

export interface RequiredAbility {
  action: Actions;
  subject: Subjects;
}

export const CHECK_ABILITY = 'check_ability';
export const CheckAbilities = (ability: RequiredAbility) =>
  SetMetadata(CHECK_ABILITY, ability);
