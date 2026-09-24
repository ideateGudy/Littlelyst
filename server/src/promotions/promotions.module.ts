import { Module } from "@nestjs/common";
import { PromotionsService } from "./promotions.service.js";
import { PromotionsController } from "./promotions.controller.js";

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
