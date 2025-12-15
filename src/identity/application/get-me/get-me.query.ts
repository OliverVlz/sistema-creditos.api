import { IQuery } from '@nestjs/cqrs';
import { User } from '../../domain/user.model';

export class GetMeQuery implements IQuery {
  constructor(public readonly user: User) {}
}



