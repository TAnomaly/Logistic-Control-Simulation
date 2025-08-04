import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const correlationId = request.headers['x-correlation-id'] || 'unknown';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                message = (exceptionResponse as any).message || exception.message;
                errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
            } else {
                message = exception.message;
                errorCode = 'HTTP_EXCEPTION';
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            errorCode = 'UNKNOWN_ERROR';
        }

        // Log the error with correlation ID
        this.logger.error(
            `Exception occurred: ${message}`,
            exception instanceof Error ? exception.stack : 'Unknown error',
            {
                correlationId,
                path: request.url,
                method: request.method,
                statusCode: status,
                errorCode,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
            }
        );

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            errorCode,
            correlationId,
            ...(process.env.NODE_ENV === 'development' && {
                stack: exception instanceof Error ? exception.stack : undefined,
            }),
        };

        response.status(status).json(errorResponse);
    }
} 