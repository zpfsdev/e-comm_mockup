import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const mapped = this.mapPrismaError(exception);
    const resolved = mapped ?? exception;

    const status =
      resolved instanceof HttpException
        ? resolved.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      resolved instanceof HttpException
        ? ((resolved.getResponse() as Record<string, unknown>)['message'] ??
          resolved.message)
        : 'Internal server error';

    const error =
      resolved instanceof HttpException ? resolved.name : 'InternalServerError';

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        resolved instanceof Error ? resolved.stack : String(resolved),
      );
    }

    const body: ErrorResponse = {
      statusCode: status,
      message: message as string | string[],
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private mapPrismaError(exception: unknown): HttpException | null {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return new ConflictException(
            'A record with this value already exists.',
          );
        case 'P2025':
          return new NotFoundException('The requested record was not found.');
        default:
          return null;
      }
    }
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return new BadRequestException('Invalid data format.');
    }
    return null;
  }
}
