import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetMeQuery } from './get-me.query';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { UserRole } from 'src/shared/enums';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async execute(query: GetMeQuery) {
    const { user } = query;
    const userInfo = user.getUserInfo();

    if (user.role === UserRole.CLIENTE) {
      const client = await this.clientRepository.findOne({
        where: { user: { id: user.id } },
        select: ['id'],
      });

      return {
        ...userInfo,
        clientId: client?.id ?? null,
      };
    }

    return userInfo;
  }
}



