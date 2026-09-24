import { Module } from "@nestjs/common";
import { RefreshTokensService } from "./refresh-tokens.service.js";

@Module({
  providers: [RefreshTokensService],
  exports: [RefreshTokensService],
})
export class RefreshTokensModule {}
