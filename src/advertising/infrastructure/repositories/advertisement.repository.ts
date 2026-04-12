import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { Advertisement } from '../entity/advertisement.entity';

type CreateAdvertisementData = {
  title: string;
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
  Omit<Advertisement, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
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
    private readonly storageService: StorageService,
  ) {}

  private resolveImageUrl<T extends { imageKey: string; imageUrl?: string }>(
    row: T,
  ): void {
    row.imageUrl = this.storageService.getPublicUrl(
      row.imageKey,
      this.storageService.getPublicBucketName(),
    );
  }

  async createAdvertisement(data: CreateAdvertisementData): Promise<Advertisement> {
    const entity = this.advertisementRepository.create({
      ...data,
      updatedBy: data.createdBy,
    });
    const advertisement = await this.advertisementRepository.save(entity);
    this.resolveImageUrl(advertisement);
    return advertisement;
  }

  async findOne(id: string): Promise<Advertisement> {
    const advertisement = await this.advertisementRepository.findOne({
      where: { id },
    });
    if (!advertisement) {
      throw new NotFoundException(`Publicidad con ID ${id} no encontrada`);
    }
    this.resolveImageUrl(advertisement);
    return advertisement;
  }

  async updateAdvertisement(
    id: string,
    data: UpdateAdvertisementData,
  ): Promise<Advertisement> {
    const advertisement = await this.findOne(id);
    const merged = this.advertisementRepository.merge(advertisement, data);
    const updated = await this.advertisementRepository.save(merged);
    this.resolveImageUrl(updated);
    return updated;
  }

  async setAdvertisementStatus(
    id: string,
    isActive: boolean,
    updatedBy?: string,
  ): Promise<Advertisement> {
    return this.updateAdvertisement(id, { isActive, updatedBy });
  }

  async deleteAdvertisement(id: string): Promise<void> {
    const result = await this.advertisementRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Publicidad con ID ${id} no encontrada`);
    }
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
    advertisements.forEach(row => this.resolveImageUrl(row));
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
    data.forEach(row => this.resolveImageUrl(row));

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
      .getMany()
      .then(rows => {
        rows.forEach(row => this.resolveImageUrl(row));
        return rows;
      });
  }

}
