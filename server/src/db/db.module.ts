import { Global, Module } from "@nestjs/common";
import { dbProvider, DRIZZLE } from "./index.js";

@Global()
@Module({
  providers: [dbProvider],
  exports: [DRIZZLE],
})
export class DbModule {}
