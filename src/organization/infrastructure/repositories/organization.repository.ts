import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entity/organization.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateOrganization = {
  name: string;
  description?: string;
  createdBy: string;
};

type UpdateOrganization = {
  name?: string;
  description?: string;
  updatedBy: string;
  isActive?: boolean;
};

type OrganizationSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
};

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(organization: CreateOrganization) {
    const createdOrganization = this.organizationRepository.create(organization);
    return this.organizationRepository.save(createdOrganization);
  }

  async findAll() {
    const organizations = await this.organizationRepository.find({
      relations: ['creator', 'updater'],
      order: { createdAt: 'DESC' },
    });
    return organizations;
  }

  async findOne(id: string) {
    const organization = await this.organizationRepository.findOne({ 
      where: { id },
      relations: ['creator', 'updater']
    });
    if (!organization) {
      throw new DomainError('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }
    return organization;
  }

  async update(id: string, organization: UpdateOrganization) {
    await this.organizationRepository.update(id, organization);
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleteResult = await this.organizationRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }
  }

  async searchOrganizationsWithPagination(searchData: OrganizationSearchData) {
    const queryBuilder = this.organizationRepository.createQueryBuilder('organization')
      .leftJoinAndSelect('organization.creator', 'creator')
      .leftJoinAndSelect('organization.updater', 'updater');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(organization.name) LIKE :term OR LOWER(organization.description) LIKE :term)`,
        { term: `%${term}%` }
      );
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('organization.isActive = :isActive', { 
        isActive: searchData.isActive 
      });
    }

    queryBuilder.orderBy('organization.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder
      .skip(paginationOptions.offset)
      .take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }
}
