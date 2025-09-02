export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJson() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export type DomainErrorCodes = {
  [key: string]: string;
};
