import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AddressesService } from "./addresses.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

import { CreateAddressDto } from "./dto/create-address.dto.js";
import { UpdateAddressDto } from "./dto/update-address.dto.js";

@Controller("api/addresses")
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async list(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.addressesService.listByUser(user.id);
    return { status: "success", data };
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto,
  ) {
    const data = await this.addressesService.create(user.id, {
      label: dto.label || "Home",
      line1: dto.line1,
      line2: dto.line2 ?? null,
      city: dto.city || dto.state || "Lagos",
      state: dto.state ?? "",
      zip: dto.zip ?? "",
      country: dto.country ?? "Nigeria",
    });
    return { status: "success", data };
  }

  @Put(":id")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAddressDto,
  ) {
    const data = await this.addressesService.update(id, user.id, dto);
    return { status: "success", data };
  }

  @Delete(":id")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.addressesService.delete(id, user.id);
    return { status: "success", data };
  }
}
