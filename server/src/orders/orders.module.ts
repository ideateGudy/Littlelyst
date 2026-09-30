import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";
import { PromotionsModule } from "../promotions/promotions.module.js";
import { EmailModule } from "../email/email.module.js";

@Module({
  imports: [PromotionsModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
