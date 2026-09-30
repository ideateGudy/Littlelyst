import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AddressesService } from "./addresses.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

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
    @Body()
    body: {
      label: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      zip?: string;
      country?: string;
    },
  ) {
    const data = await this.addressesService.create(user.id, {
      label: body.label,
      line1: body.line1,
      line2: body.line2 ?? null,
      city: body.city,
      state: body.state ?? "",
      zip: body.zip ?? "",
      country: body.country ?? "Nigeria",
    });
    return { status: "success", data };
  }
}
