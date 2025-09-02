import { DomainError } from 'src/shared/domain';

export class DomainTypeError extends DomainError {
  static invalidDateValue(message?: string) {
    return new DomainTypeError(
      'INVALID_DATE_VALUE',
      message ?? 'Date value is invalid',
    );
  }

  static invalidDateRange(message?: string) {
    return new DomainTypeError(
      'INVALID_DATE_RANGE',
      message ?? 'Date range is invalid',
    );
  }
}
