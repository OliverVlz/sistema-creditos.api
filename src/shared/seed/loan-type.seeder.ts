import { Repository } from 'typeorm';
import { LoanType } from '../../loan-type/infrastructure/entity/loan-type.entity';

const LOAN_TYPES_DATA = [
  {
    name: 'Libranza',
    description: 'Préstamo por descuento de nómina para funcionarios de fuerzas armadas',
    interestRate: 25,
    minAmount: 500000,
    maxAmount: 20000000,
    minTerm: 6,
    maxTerm: 60,
  },
];

export class LoanTypeSeeder {
  async seed(loanTypeRepository: Repository<LoanType>) {
    const loanTypes: LoanType[] = [];

    for (const data of LOAN_TYPES_DATA) {
      let loanType = await loanTypeRepository.findOne({
        where: { name: data.name },
      });

      if (!loanType) {
        loanType = await loanTypeRepository.save(
          loanTypeRepository.create({
            ...data,
            isActive: true,
          }),
        );
        console.log(
          `  ✓ Tipo de préstamo "${data.name}" creado (tasa: ${data.interestRate}%)`,
        );
      }

      loanTypes.push(loanType);
    }

    console.log(
      `✅ Seeders de LoanTypes ejecutados: ${loanTypes.length} tipos creados`,
    );
    return loanTypes;
  }
}
