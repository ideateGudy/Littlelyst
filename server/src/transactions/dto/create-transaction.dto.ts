import { IsNotEmpty, IsUUID, IsOptional, IsString } from "class-validator";

export class CreateTransactionDto {
  @IsNotEmpty({ message: "fromAccount is required" })
  @IsUUID("4", { message: "fromAccount must be a valid UUID" })
  fromAccount!: string;

  @IsNotEmpty({ message: "toAccount is required" })
  @IsUUID("4", { message: "toAccount must be a valid UUID" })
  toAccount!: string;

  @IsNotEmpty({ message: "amount is required" })
  amount!: string | number; // Accept integer/string representation of minor units (kobo/cents)

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class CreateInitialFundsDto {
  @IsNotEmpty({ message: "toAccount is required" })
  @IsUUID("4", { message: "toAccount must be a valid UUID" })
  toAccount!: string;

  @IsNotEmpty({ message: "amount is required" })
  amount!: string | number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
