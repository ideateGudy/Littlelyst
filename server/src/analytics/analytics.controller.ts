import { Controller, Get, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/analytics")
@UseGuards(AccessTokenGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  async getDashboard(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.analyticsService.getSellerDashboardStats(user.id);
    return {
      status: "success",
      message: "Analytics summary retrieved",
      data,
    };
  }
}
