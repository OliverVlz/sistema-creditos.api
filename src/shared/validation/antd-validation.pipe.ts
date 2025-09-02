import {
  ValidationPipe,
  BadRequestException,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

/**
 * Antd validation pipe.
 * Handles Data Transfer Object validation errors and
 * formats them into a suitable Antd v4 error form interface.
 *
 * @todo Handle nested fields
 */
export class AntdValidationPipe extends ValidationPipe {
  constructor(options: ValidationPipeOptions = {}) {
    super({
      stopAtFirstError: true,
      validationError: { target: false },
      exceptionFactory: errors => this.formatErrorsToAntdForm(errors),
      whitelist: true,
      ...options,
    });
  }

  formatErrorsToAntdForm(errors: ValidationError[]) {
    return new BadRequestException(
      errors.map(error => this.formatConstraints(error)).flat(),
    );
  }

  private formatConstraints(error: ValidationError, prefix?: string) {
    if (error.children.length) {
      return error.children.map(child =>
        this.formatConstraints(child, error.property),
      );
    }
    return {
      name: prefix ? `${prefix}.${error.property}` : error.property,
      errors: Object.values(error.constraints),
    };
  }
}
