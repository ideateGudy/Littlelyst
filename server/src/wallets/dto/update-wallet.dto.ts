import { IsEnum, IsOptional } from "class-validator";

export class UpdateWalletDto {
  @IsOptional()
  @IsEnum(["ACTIVE", "FROZEN", "CLOSED"], {
    message: "Status must be one of the following: ACTIVE, FROZEN, or CLOSED",
  })
  status?: "ACTIVE" | "FROZEN" | "CLOSED";

  @IsOptional()
  @IsEnum(["NGN", "USD", "EUR"], {
    message: "Currency must be one of the following: NGN, USD, or EUR",
  })
  currency?: "NGN" | "USD" | "EUR";
}
