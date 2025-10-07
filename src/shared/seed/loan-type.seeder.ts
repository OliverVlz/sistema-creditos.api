import { Repository } from 'typeorm';
import { LoanType } from '../../loan-type/infrastructure/entity/loan-type.entity';
import { Organization } from '../../organization/infrastructure/entity/organization.entity';

export class LoanTypeSeeder {
  async seed(
    loanTypeRepository: Repository<LoanType>,
    organizationRepository: Repository<Organization>,
  ) {
    // Obtener una organización existente (la primera que se encuentre)
    const defaultOrganization = await organizationRepository.findOne({ where: {} });

    if (!defaultOrganization) {
      console.log('⚠️ No se encontró una organización para crear LoanTypes. Ejecuta primero el seeder de organizaciones.');
      return [];
    }

    const loanTypesData = [
      {
        name: 'Libranza',
        description: 'Préstamo por descuento de nómina',
        baseProcessingFee: 1.5,
        maxAmount: 5000000,
        minAmount: 1000000,
        maxTermMonths: 36,
        isActive: true,
        organization: defaultOrganization, // Asociar a la organización por defecto
      },
      // Puedes añadir más tipos de préstamos aquí
    ];

    const loanTypes = await Promise.all(
      loanTypesData.map(async data => {
        let loanType = await loanTypeRepository.findOne({
          where: { name: data.name, organization: { id: data.organization.id } }
        });
        if (!loanType) {
          loanType = await loanTypeRepository.save(loanTypeRepository.create(data));
        }
        return loanType;
      }),
    );

    console.log('✅ Seeders de LoanTypes ejecutados con éxito');
    return loanTypes;
  }
}











