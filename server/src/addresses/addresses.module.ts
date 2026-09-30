import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module.js";
import { AddressesService } from "./addresses.service.js";
import { AddressesController } from "./addresses.controller.js";

@Module({
  imports: [DbModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
