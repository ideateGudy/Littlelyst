import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { CatalogueService } from "./catalogue.service.js";
import type { Request } from "express";

@Controller("api/catalogue")
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get(":handle")
  async getCatalogue(
    @Param("handle") handle: string,
    @Query("utm_source") utmSource?: string,
    @Req() req?: Request,
  ) {
    const referrer = req?.headers["referer"] || req?.headers["referrer"];
    const trafficSource = utmSource || (referrer ? "social" : "direct");
    const data = await this.catalogueService.getSellerCatalogue(handle, {
      trafficSource: String(trafficSource),
      referrer: referrer ? String(referrer) : undefined,
    });

    return {
      status: "success",
      message: "Catalogue loaded successfully",
      data,
    };
  }

  @Get(":handle/products/:slug")
  async getProduct(
    @Param("handle") handle: string,
    @Param("slug") slug: string,
    @Query("utm_source") utmSource?: string,
    @Req() req?: Request,
  ) {
    const referrer = req?.headers["referer"] || req?.headers["referrer"];
    const trafficSource = utmSource || (referrer ? "social" : "direct");
    const data = await this.catalogueService.getPublicProduct(handle, slug, {
      trafficSource: String(trafficSource),
      referrer: referrer ? String(referrer) : undefined,
    });

    return {
      status: "success",
      message: "Product loaded successfully",
      data,
    };
  }
}
