import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "./db/db.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { RefreshTokensModule } from "./refresh-tokens/refresh-tokens.module.js";
import { WalletsModule } from "./wallets/wallets.module.js";
import { LedgerModule } from "./ledger/ledger.module.js";
import { TransactionsModule } from "./transactions/transactions.module.js";
import { EmailModule } from "./email/email.module.js";
import { ProductsModule } from "./products/products.module.js";
import { CatalogueModule } from "./catalogue/catalogue.module.js";
import { PromotionsModule } from "./promotions/promotions.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { UploadsModule } from "./uploads/uploads.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DbModule,
    UsersModule,
    RefreshTokensModule,
    EmailModule,
    AuthModule,
    WalletsModule,
    LedgerModule,
    TransactionsModule,
    ProductsModule,
    CatalogueModule,
    PromotionsModule,
    OrdersModule,
    PaymentsModule,
    AnalyticsModule,
    UploadsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
