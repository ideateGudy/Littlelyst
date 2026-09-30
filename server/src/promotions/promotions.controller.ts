import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

  @Put("coupons/:id")
  @UseGuards(AccessTokenGuard)
  async updateCoupon(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() dto: Partial<CreateCouponDto> & { isActive?: boolean },
  ) {
    const data = await this.promotionsService.updateCoupon(user.id, id, dto);
    return {
      status: "success",
      message: "Coupon updated successfully",
      data,
    };
  }

  @Put("coupons/:id/toggle")
  @UseGuards(AccessTokenGuard)
  async toggleCoupon(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    const data = await this.promotionsService.toggleCoupon(user.id, id);
    return {
      status: "success",
      message: `Coupon ${data.isActive ? "activated" : "deactivated"} successfully`,
      data,
    };
  }

  @Delete("coupons/:id")
  @UseGuards(AccessTokenGuard)
  async deleteCoupon(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    const data = await this.promotionsService.deleteCoupon(user.id, id);
    return {
      status: "success",
      message: "Coupon deleted successfully",
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
      productId?: string;
      basePriceMinor: number | string;
      cartItems?: Array<{ productId: string; unitPriceMinor: number; quantity: number }>;
    },
  ) {
    const result = await this.promotionsService.validateAndApplyCoupon(
      body.sellerId,
      body.code,
      BigInt(body.basePriceMinor),
      body.productId,
      body.cartItems,
    );

    return {
      status: "success",
      message: "Coupon is valid",
      data: {
        code: result.coupon.code,
        discountMinor: result.discountMinor.toString(),
        finalPriceMinor: result.finalPriceMinor.toString(),
        matchedProductId: result.matchedProductId,
        redemptionsRemaining:
          result.coupon.maxRedemptions - result.coupon.redemptionsCount,
      },
    };
  }
}
