import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { WalletsService } from "./wallets.service.js";
import { CreateWalletDto } from "./dto/create-wallet.dto.js";
import { UpdateWalletDto } from "./dto/update-wallet.dto.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";


@Controller("api/accounts")
@UseGuards(AccessTokenGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWalletDto,
  ) {
    const account = await this.walletsService.createWallet(user.id, dto);
    return {
      status: "success",
      message: "Account created successfully",
      data: account,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllAccounts(@CurrentUser() user: CurrentUserPayload) {
    const accounts = await this.walletsService.getAllWallets(user.id);
    return {
      status: "success",
      data: accounts,
    };
  }

  @Get("balance/:accountId")
  @HttpCode(HttpStatus.OK)
  async getAccountBalance(
    @CurrentUser() user: CurrentUserPayload,
    @Param("accountId") accountId: string,
  ) {
    const account = await this.walletsService.getWalletById(user.id, accountId);
    const balance = await this.walletsService.getBalance(account.id);

    return {
      status: "success",
      message: "Account balance retrieved successfully",
      data: {
        account: {
          _id: account.id,
          id: account.id,
          user: account.userId,
          currency: account.currency,
          status: account.status,
        },
        balance: balance.toString(),
      },
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    const account = await this.walletsService.getWalletById(user.id, id);
    return {
      status: "success",
      data: account,
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  async updateAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    const account = await this.walletsService.updateWallet(user.id, id, dto);
    return {
      status: "success",
      message: "Account updated successfully",
      data: account,
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    await this.walletsService.deleteWallet(user.id, id);
    return {
      status: "success",
      message: "Account deleted successfully",
    };
  }
}
