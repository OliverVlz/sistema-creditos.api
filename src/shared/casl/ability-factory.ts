import {
  AbilityBuilder,
  createMongoAbility,
  InferSubjects,
} from '@casl/ability';
import { User } from 'src/identity/domain/user.model';
import { User as UserEntity } from 'src/identity/infrastructure/entity/user.entity';
import { UserRole } from 'src/shared/enums';

export enum Actions {
  Update = 'update',
  Manage = 'manage',
}

export type Subjects = InferSubjects<typeof User> | 'all';
export type AppAbility = ReturnType<typeof createMongoAbility>;

export class CaslAbilityFactory {
  createForUser(user: UserEntity): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    if (user.role !== UserRole.Admin) {
      const forbiddenFields = ['role', 'createdAt', 'updatedAt'];

      can(Actions.Update, 'User', { id: user.id });
      cannot(Actions.Update, 'User', forbiddenFields);
    } else {
      can(Actions.Manage, 'all');
    }

    return build();
  }
}
