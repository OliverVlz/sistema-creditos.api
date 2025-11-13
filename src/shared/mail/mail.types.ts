import { ModuleMetadata } from '@nestjs/common';
import { SendMailOptions, Transporter } from 'nodemailer';

export type MailContent = Promise<SendMailOptions>;
export interface EmailTemplate {
  build(): MailContent;
}

export interface EmailTemplateProps<TData = Record<string, any>> {
  email: string;
  data: TData;
  fileName?: string;
  fileContent?: Buffer;
  deliveryTime?: string;
}

export type TemplateComponentProps<TData = Record<string, any>> = {
  data: TData;
};

export interface MailModuleOptions {
  transport: Transporter;
  mailgunConfig: {
    url: string;
    auth: {
      username: string;
      password: string;
    };
  };
}

export interface MailModuleRootAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  imports?: any[];
  inject?: any[];
  useFactory: (
    ...args: unknown[]
  ) => Promise<MailModuleOptions> | MailModuleOptions;
}
