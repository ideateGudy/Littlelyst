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
import { AdminService } from "./admin.service.js";
import type { CreateAdminUserDto } from "./admin.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import { SystemUserGuard } from "../common/guards/system-user.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/admin")
@UseGuards(AccessTokenGuard, SystemUserGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("overview")
  async getOverview() {
    const data = await this.adminService.getPlatformFinancialOverview();
    return {
      status: "success",
      message: "Platform financial overview retrieved",
      data,
    };
  }

  @Get("users")
  async listUsers() {
    const data = await this.adminService.listAllUsers();
    return {
      status: "success",
      message: "Users retrieved successfully",
      data,
    };
  }

  @Post("users")
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.adminService.createUser(dto, user);
    return {
      status: "success",
      message: "User account created successfully",
      data,
    };
  }

  @Put("users/:id/role")
  async updateRole(
    @Param("id") id: string,
    @Body() body: { role: "seller" | "admin" | "buyer" },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.adminService.updateUserRole(id, body.role, user);
    return {
      status: "success",
      message: "User role updated successfully",
      data,
    };
  }

  @Delete("users/:id")
  async deleteUser(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.adminService.deleteUser(id, user);
    return data;
  }
}
