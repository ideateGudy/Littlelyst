import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";
import { PaymentsController } from "./payments.controller.js";
import { PaystackAdapter } from "./paystack.adapter.js";
import { PaymentRegistryService } from "./payment-registry.service.js";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackAdapter, PaymentRegistryService],
  exports: [PaymentsService, PaystackAdapter, PaymentRegistryService],
})
export class PaymentsModule {}
