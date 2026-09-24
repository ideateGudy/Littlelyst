import { IsEnum, IsOptional } from "class-validator";

export class CreateWalletDto {
  @IsOptional()
  @IsEnum(["NGN", "USD", "EUR"], {
    message: "Currency must be one of the following: NGN, USD, or EUR",
  })
  currency?: "NGN" | "USD" | "EUR";
}
