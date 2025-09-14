import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentRequirementCommand } from './create-document-requirement.command';
import { LoanTypeDocumentRequirement } from '../../infrastructure/entity/loan-type-document-requirement.entity';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateDocumentRequirementCommand)
export class CreateDocumentRequirementHandler implements ICommandHandler<CreateDocumentRequirementCommand> {
  constructor(
    @InjectRepository(LoanTypeDocumentRequirement)
    private requirementRepository: Repository<LoanTypeDocumentRequirement>,
  ) {}

  async execute(command: CreateDocumentRequirementCommand): Promise<{ requirementId: string }> {
    const { 
      loanTypeId, 
      documentTypeId, 
      organizationId, 
      employmentStatus, 
      isMandatory, 
      displayOrder, 
      validationRules 
    } = command;

    const existingRequirement = await this.requirementRepository.findOne({
      where: {
        loanTypeId,
        documentTypeId,
        organizationId: organizationId || null,
        employmentStatus: employmentStatus || null,
      }
    });

    if (existingRequirement) {
      throw new BadRequestException(
        'Document requirement already exists for this loan type, organization, and employment status combination'
      );
    }

    const newRequirement = this.requirementRepository.create({
      loanTypeId,
      documentTypeId,
      organizationId,
      employmentStatus,
      isMandatory,
      displayOrder,
      validationRules,
    });

    const savedRequirement = await this.requirementRepository.save(newRequirement);

    return { requirementId: savedRequirement.id };
  }
}

