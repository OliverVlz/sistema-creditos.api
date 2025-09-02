import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { Response } from 'express';

// Import Exceptions that are handled by the application
import {
  BadRequestException,
  ForbiddenException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';

type ExtendedRequest = Request & { params?: unknown; query?: unknown };
type FormattedException = {
  name: string;
  code: number;
  message: string;
  stack: string;
};
type FormattedRequest = {
  url: string;
  body?: unknown;
  query?: unknown;
};

/** This filter is responsible for catching all unhandled exceptions and logging them. */
@Catch(HttpException)
export class UnhandledExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException | TypeError | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const requestData = ctx.getRequest<ExtendedRequest>();
    const response = ctx.getResponse<Response>();

    const { name, code, message, stack } = this.formatException(exception);
    const request = this.formatRequest(requestData);

    this.filterExceptionsToLog(exception, {
      name,
      code,
      message,
      stack,
      request,
    });

    response
      .status(
        code >= 100 && code < 600 ? code : HttpStatus.INTERNAL_SERVER_ERROR,
      )
      .json({ name, code, message, request });
  }

  private formatException(
    exception: HttpException | TypeError | Error,
  ): FormattedException {
    const defaultName = exception.name || 'UnhandledException';
    const defaultCode =
      (exception as any).code ||
      (exception as any).statusCode ||
      HttpStatus.INTERNAL_SERVER_ERROR;
    const defaultMessage = exception.message || 'Unhandled Error';
    const defaultStack = exception.stack;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        return {
          name: defaultName,
          code: defaultCode,
          message: exceptionResponse || defaultMessage,
          stack: defaultStack,
        };
      } else {
        const { statusCode, error, message } = exceptionResponse as any;
        return {
          name: error || defaultName,
          code: statusCode || defaultCode,
          message: message || defaultMessage,
          stack: defaultStack,
        };
      }
    } else {
      return {
        name: defaultName,
        code: defaultCode,
        message: defaultMessage,
        stack: defaultStack,
      };
    }
  }

  private formatRequest(request: ExtendedRequest): FormattedRequest {
    const { url, body, query } = request;
    return {
      url,
      ...(Object.keys(body).length !== 0 && { body }),
      ...(Object.keys(query).length !== 0 && { query }),
    };
  }

  private filterExceptionsToLog(
    exception: Error,
    details: FormattedException & { request: FormattedRequest },
  ) {
    if (
      [
        BadRequestException,
        NotAcceptableException,
        NotFoundException,
        ForbiddenException,
        UnauthorizedException,
      ].some(e => exception instanceof e)
    ) {
      return;
    }

    this.logger.error(details);
  }
}
