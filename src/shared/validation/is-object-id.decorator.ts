import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsUUID(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsUUID',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return typeof value === 'string' && uuidRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `(${args.value}) is not a valid UUID!`;
        },
      },
    });
  };
}

export const IsObjectId = IsUUID;
