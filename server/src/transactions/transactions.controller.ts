import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { TransactionsService } from "./transactions.service.js";
import {
  CreateTransactionDto,
  CreateInitialFundsDto,
} from "./dto/create-transaction.dto.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import { SystemUserGuard } from "../common/guards/system-user.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";


@Controller("api/transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async createTransaction(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTransactionDto,
    @Res() res: Response,
  ) {
    const result = await this.transactionsService.createTransaction(dto, user);
    return res.status(result.statusCode).json(result.response);
  }

  @Post("system/initial-funds")
  @UseGuards(AccessTokenGuard, SystemUserGuard)
  async createInitialFunds(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInitialFundsDto,
    @Res() res: Response,
  ) {
    const result =
      await this.transactionsService.createInitialFundsTransaction(dto, user);
    return res.status(result.statusCode).json(result.response);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  async getAllTransactions(@CurrentUser() user: CurrentUserPayload) {
    return this.transactionsService.getAllTransactions(user.id);
  }

  @Get(":id")
  @UseGuards(AccessTokenGuard)
  async getTransactionById(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    return this.transactionsService.getTransactionById(user.id, id);
  }
}
