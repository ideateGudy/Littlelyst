import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let extra: Record<string, unknown> = {};

    if (!(exception instanceof HttpException)) {
      this.logger.error("Unhandled Exception:", exception);
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const obj = res as Record<string, unknown>;
        if (obj.message) {
          message = Array.isArray(obj.message)
            ? obj.message.join(", ")
            : String(obj.message);
        }
        extra = obj;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      status: "failed",
      message,
      ...extra,
    });
  }
}
