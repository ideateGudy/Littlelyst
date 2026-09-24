import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get list of registered active payment gateways
   */
  @Get("gateways")
  getGateways() {
    const gateways = this.paymentsService.getAvailableGateways();
    return { status: "success", data: gateways };
  }

  /**
   * Get list of supported Nigerian banks
   */
  @Get("banks")
  async getBanks() {
    const banks = await this.paymentsService.getBanks();
    return { status: "success", data: banks };
  }

  /**
   * Initialize payment authorization URL
   */
  @Post("initialize")
  async initializePayment(
    @Body()
    body: {
      email: string;
      amountMinor: number;
      reference: string;
      callbackUrl?: string;
      subaccount?: string;
      platformFeeMinor?: number;
      provider?: string;
    },
  ) {
    if (!body.email || !body.amountMinor || !body.reference) {
      throw new BadRequestException("Email, amountMinor, and reference are required");
    }

    const data = await this.paymentsService.initializePayment(body);
    return {
      status: "success",
      data: {
        authorizationUrl: data.authorization_url,
        authorization_url: data.authorization_url,
        accessCode: data.access_code,
        access_code: data.access_code,
        reference: data.reference,
      },
    };
  }

  /**
   * Verify transaction payment status
   */
  @Get("verify/:reference")
  async verifyPayment(@Param("reference") reference: string) {
    if (!reference) {
      throw new BadRequestException("Reference is required");
    }

    const result = await this.paymentsService.verifyPayment(reference);
    return result;
  }

  /**
   * Paystack webhook listener
   */
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("x-paystack-signature") signature: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const isMock = process.env.NODE_ENV !== "production" && !signature;
    if (!isMock) {
      const rawBody = (req as any).rawBody || JSON.stringify(body);
      const isValid = this.paymentsService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new BadRequestException("Invalid webhook signature");
      }
    }

    const result = await this.paymentsService.handleWebhookEvent(body);
    return result;
  }

  /**
   * Protected route: Seller links their Nigerian bank account for direct Paystack payouts
   */
  @Put("payout-account")
  @UseGuards(AccessTokenGuard)
  async updatePayoutAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { bankName: string; accountNumber: string; bankCode?: string; provider?: string },
  ) {
    if (!body.bankName || !body.accountNumber) {
      throw new BadRequestException("Bank name and account number are required");
    }

    const result = await this.paymentsService.updateSellerBankDetails(
      user.id,
      body.bankName,
      body.accountNumber,
      body.bankCode,
      body.provider,
    );

    return {
      status: "success",
      message: "Payout account updated successfully",
      data: result,
    };
  }
}
