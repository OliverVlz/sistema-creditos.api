import {
  AbilityBuilder,
  createMongoAbility,
  InferSubjects,
} from '@casl/ability';
import { User } from 'src/identity/domain/user.model';
import { UserDocument } from 'src/identity/infrastructure/schemas/user.schema';

export enum Actions {
  Update = 'update',
  Manage = 'manage',
}

export type Subjects = InferSubjects<typeof User> | 'all';
export type AppAbility = ReturnType<typeof createMongoAbility>;

export class CaslAbilityFactory {
  createForUser(user: UserDocument): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    if (user.role !== 'admin') {
      const forbiddenFields = ['role', 'isActive'];

      can('update', 'User', { id: user.id });
      cannot('update', 'User', forbiddenFields);
    } else {
      can(Actions.Manage, 'all');
    }

    return build();
  }
}
