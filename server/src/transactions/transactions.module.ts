import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller.js";
import { TransactionsService } from "./transactions.service.js";
import { WalletsModule } from "../wallets/wallets.module.js";
import { LedgerModule } from "../ledger/ledger.module.js";
import { EmailModule } from "../email/email.module.js";

@Module({
  imports: [WalletsModule, LedgerModule, EmailModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
