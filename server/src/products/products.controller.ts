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
import { ProductsService } from "./products.service.js";
import type { CreateProductDto, UpdateProductDto } from "./products.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

@Controller("api/products")
@UseGuards(AccessTokenGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.productsService.listSellerProducts(user.id);
    return {
      status: "success",
      message: "Products retrieved successfully",
      data,
    };
  }

  @Get(":id")
  async getOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    const data = await this.productsService.getSellerProductById(user.id, id);
    return {
      status: "success",
      message: "Product retrieved successfully",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProductDto,
  ) {
    const data = await this.productsService.createProduct(user.id, dto);
    return {
      status: "success",
      message: "Product created successfully",
      data,
    };
  }

  @Put(":id")
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const data = await this.productsService.updateProduct(user.id, id, dto);
    return {
      status: "success",
      message: "Product updated successfully",
      data,
    };
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param("id") id: string,
  ) {
    await this.productsService.deleteProduct(user.id, id);
    return {
      status: "success",
      message: "Product deleted successfully",
    };
  }
}
