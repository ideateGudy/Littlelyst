import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { OrdersService } from "./orders.service.js";
import type { GuestCheckoutDto } from "./orders.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public Guest Checkout
  @Post("checkout")
  @HttpCode(HttpStatus.CREATED)
  async checkout(@Body() dto: GuestCheckoutDto) {
    const data = await this.ordersService.initializeGuestOrder(dto);
    return {
      status: "success",
      message: "Order initialized for payment",
      data,
    };
  }

  // Public Order Confirmation & Digital Goods Delivery lookup
  @Get("reference/:reference")
  async getOrder(@Param("reference") reference: string) {
    const data = await this.ordersService.getOrderDetails(reference);
    return {
      status: "success",
      message: "Order details loaded",
      data,
    };
  }

  // Seller Protected Dashboard Orders
  @Get()
  @UseGuards(AccessTokenGuard)
  async getSellerOrders(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.ordersService.listSellerOrders(user.id);
    return {
      status: "success",
      message: "Seller orders retrieved",
      data,
    };
  }

  // Update Order Status (e.g. Fulfilled, Paid, Cancelled)
  @Post(":id/status")
  @UseGuards(AccessTokenGuard)
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED" },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.ordersService.updateOrderStatus(id, user.id, body.status);
    return {
      status: "success",
      message: "Order status updated successfully",
      data,
    };
  }
}
