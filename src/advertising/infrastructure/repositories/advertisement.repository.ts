import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { Advertisement } from '../entity/advertisement.entity';
import { AdvertisementHistory } from '../entity/advertisement-history.entity';

type CreateAdvertisementData = {
  title: string;
  imageUrl: string;
  imageKey: string;
  targetUrl?: string;
  isRedirectEnabled: boolean;
  isActive: boolean;
  sortOrder: number;
  startsAt?: Date;
  endsAt?: Date;
  createdBy?: string;
};

type UpdateAdvertisementData = Partial<
  Omit<
    Advertisement,
    'id' | 'createdAt' | 'updatedAt' | 'history' | 'createdBy' | 'updatedBy'
  >
> & {
  updatedBy?: string;
};

type SearchAdvertisementsData = {
  terms?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
};

@Injectable()
export class AdvertisementRepository {
  constructor(
    @InjectRepository(Advertisement)
    private readonly advertisementRepository: Repository<Advertisement>,
    @InjectRepository(AdvertisementHistory)
    private readonly advertisementHistoryRepository: Repository<AdvertisementHistory>,
  ) {}

  async createAdvertisement(data: CreateAdvertisementData): Promise<Advertisement> {
    const entity = this.advertisementRepository.create({
      ...data,
      updatedBy: data.createdBy,
    });
    const advertisement = await this.advertisementRepository.save(entity);
    await this.createHistorySnapshot(advertisement, 'created', data.createdBy);
    return advertisement;
  }

  async findOne(id: string): Promise<Advertisement> {
    const advertisement = await this.advertisementRepository.findOne({
      where: { id },
    });
    if (!advertisement) {
      throw new NotFoundException(`Publicidad con ID ${id} no encontrada`);
    }
    return advertisement;
  }

  async updateAdvertisement(
    id: string,
    data: UpdateAdvertisementData,
    action: string = 'updated',
  ): Promise<Advertisement> {
    const advertisement = await this.findOne(id);
    const merged = this.advertisementRepository.merge(advertisement, data);
    const updated = await this.advertisementRepository.save(merged);
    await this.createHistorySnapshot(updated, action, data.updatedBy);
    return updated;
  }

  async setAdvertisementStatus(
    id: string,
    isActive: boolean,
    updatedBy?: string,
  ): Promise<Advertisement> {
    const action = isActive ? 'activated' : 'deactivated';
    return this.updateAdvertisement(id, { isActive, updatedBy }, action);
  }

  async reorderAdvertisements(
    items: { id: string; sortOrder: number }[],
    updatedBy?: string,
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    await Promise.all(
      items.map(item =>
        this.advertisementRepository.update(item.id, {
          sortOrder: item.sortOrder,
          updatedBy,
        }),
      ),
    );

    const ids = items.map(item => item.id);
    const advertisements = await this.advertisementRepository.find({
      where: ids.map(id => ({ id })),
    });

    await Promise.all(
      advertisements.map(advertisement =>
        this.createHistorySnapshot(advertisement, 'reordered', updatedBy),
      ),
    );
  }

  async searchWithPagination(searchData: SearchAdvertisementsData) {
    const queryBuilder =
      this.advertisementRepository.createQueryBuilder('advertisement');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(`LOWER(advertisement.title) LIKE :term`, {
        term: `%${term}%`,
      });
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('advertisement.isActive = :isActive', {
        isActive: searchData.isActive,
      });
    }

    queryBuilder
      .orderBy('advertisement.sortOrder', 'ASC')
      .addOrderBy('advertisement.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder.skip(paginationOptions.offset).take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }

  async getPublicActiveAdvertisements(limit: number = 20): Promise<Advertisement[]> {
    const now = new Date();
    return this.advertisementRepository
      .createQueryBuilder('advertisement')
      .where('advertisement.isActive = :isActive', { isActive: true })
      .andWhere(
        '(advertisement.startsAt IS NULL OR advertisement.startsAt <= :now)',
        { now },
      )
      .andWhere('(advertisement.endsAt IS NULL OR advertisement.endsAt >= :now)', {
        now,
      })
      .orderBy('advertisement.sortOrder', 'ASC')
      .addOrderBy('advertisement.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async getHistory(advertisementId: string): Promise<AdvertisementHistory[]> {
    return this.advertisementHistoryRepository.find({
      where: { advertisementId },
      order: { createdAt: 'DESC' },
    });
  }

  async getHistoryById(historyId: string): Promise<AdvertisementHistory> {
    const history = await this.advertisementHistoryRepository.findOne({
      where: { id: historyId },
    });
    if (!history) {
      throw new NotFoundException(`Histórico con ID ${historyId} no encontrado`);
    }
    return history;
  }

  async recycleFromHistory(
    advertisementId: string,
    historyId: string,
    updatedBy?: string,
  ): Promise<Advertisement> {
    const history = await this.getHistoryById(historyId);
    if (history.advertisementId !== advertisementId) {
      throw new NotFoundException(
        `El histórico ${historyId} no pertenece a la publicidad ${advertisementId}`,
      );
    }

    return this.updateAdvertisement(
      advertisementId,
      {
        title: history.title,
        imageUrl: history.imageUrl,
        imageKey: history.imageKey,
        targetUrl: history.targetUrl,
        isRedirectEnabled: history.isRedirectEnabled,
        isActive: history.isActive,
        sortOrder: history.sortOrder,
        startsAt: history.startsAt,
        endsAt: history.endsAt,
        updatedBy,
      },
      'recycled',
    );
  }

  async createHistorySnapshot(
    advertisement: Advertisement,
    action: string,
    changedBy?: string,
  ): Promise<AdvertisementHistory> {
    const history = this.advertisementHistoryRepository.create({
      advertisementId: advertisement.id,
      action,
      title: advertisement.title,
      imageUrl: advertisement.imageUrl,
      imageKey: advertisement.imageKey,
      targetUrl: advertisement.targetUrl,
      isRedirectEnabled: advertisement.isRedirectEnabled,
      isActive: advertisement.isActive,
      sortOrder: advertisement.sortOrder,
      startsAt: advertisement.startsAt,
      endsAt: advertisement.endsAt,
      changedBy,
    });
    return this.advertisementHistoryRepository.save(history);
  }
}
