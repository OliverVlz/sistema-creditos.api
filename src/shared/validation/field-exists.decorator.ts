import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';

import { ALREADY_EXISTS } from './antd-validation.constants';

@ValidatorConstraint({ name: 'FieldExistsRule', async: true })
@Injectable()
export class FieldExistsRule implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  async validate(fieldvalue: string, parameters) {
    const {
      property: { fieldName: defaultFieldName },
      constraints: [{ entityName, parentName = [], fieldName: fieldNameAlias }],
    } = parameters;

    const fieldName = fieldNameAlias || defaultFieldName;
    const propertyPath = this.buildPropertyPath({ parentName, fieldName });

    return !(await this.checkIfExists({
      entityName,
      propertyPath,
      fieldvalue,
    }));
  }

  defaultMessage() {
    return ALREADY_EXISTS;
  }

  private buildPropertyPath({ parentName = [], fieldName }) {
    return [...parentName, fieldName].join('.');
  }

  private async checkIfExists({ entityName, propertyPath, fieldvalue }) {
    try {
      const repository = this.dataSource.getRepository(entityName);
      const where = {};

      if (propertyPath.includes('.')) {
        const result = await repository
          .createQueryBuilder('entity')
          .where(`entity.${propertyPath} = :value`, { value: fieldvalue })
          .getOne();
        return !!result;
      } else {
        where[propertyPath] = fieldvalue;
        const result = await repository.findOne({ where });
        return !!result;
      }
    } catch (error) {
      console.error('Error en validación FieldExists:', error);
      return false;
    }
  }
}

export function FieldExists(
  property: FieldExistsProperties,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'FieldExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: FieldExistsRule,
    });
  };
}

interface FieldExistsProperties {
  entityName: string;
  parentName?: any[];
  fieldName?: string;
}
