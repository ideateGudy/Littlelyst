import { Module, Global } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AccessTokenStrategy } from "./strategies/access-token.strategy.js";
import { UsersModule } from "../users/users.module.js";
import { RefreshTokensModule } from "../refresh-tokens/refresh-tokens.module.js";
import { EmailModule } from "../email/email.module.js";

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    UsersModule,
    RefreshTokensModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
