import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { PromotionsService } from "./promotions.service.js";
import type {
  CreatePromotionDto,
  CreateCouponDto,
} from "./promotions.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/promotions")
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // Protected seller routes
  @Get()
  @UseGuards(AccessTokenGuard)
  async getPromotions(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.promotionsService.listSellerPromotions(user.id);
    return {
      status: "success",
      message: "Promotions retrieved successfully",
      data,
    };
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPromo(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePromotionDto,
  ) {
    const data = await this.promotionsService.createPromotion(user.id, dto);
    return {
      status: "success",
      message: "Promotion created successfully",
      data,
    };
  }

  @Put(":id/end")
  @UseGuards(AccessTokenGuard)
  async endPromo(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    await this.promotionsService.endPromotion(user.id, id);
    return {
      status: "success",
      message: "Promotion ended successfully",
    };
  }

  @Get("coupons")
  @UseGuards(AccessTokenGuard)
  async getCoupons(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.promotionsService.listSellerCoupons(user.id);
    return {
      status: "success",
      message: "Coupons retrieved successfully",
      data,
    };
  }

  @Post("coupons")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCouponDto,
  ) {
    const data = await this.promotionsService.createCoupon(user.id, dto);
    return {
      status: "success",
      message: "Coupon created successfully",
      data,
    };
  }

  // Public checkout endpoint for coupon validation
  @Post("validate-coupon")
  async validateCoupon(
    @Body()
    body: {
      sellerId: string;
      code: string;
      productId: string;
      basePriceMinor: number | string;
    },
  ) {
    const result = await this.promotionsService.validateAndApplyCoupon(
      body.sellerId,
      body.code,
      body.productId,
      BigInt(body.basePriceMinor),
    );

    return {
      status: "success",
      message: "Coupon is valid",
      data: {
        code: result.coupon.code,
        discountMinor: result.discountMinor.toString(),
        finalPriceMinor: result.finalPriceMinor.toString(),
        redemptionsRemaining:
          result.coupon.maxRedemptions - result.coupon.redemptionsCount,
      },
    };
  }
}
