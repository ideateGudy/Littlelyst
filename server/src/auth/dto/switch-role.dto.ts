import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SwitchRoleDto {
  @IsNotEmpty({ message: "Target role is required" })
  @IsIn(["seller", "buyer"], { message: "Target role must be either 'seller' or 'buyer'" })
  targetRole!: "seller" | "buyer";

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Store handle must be at least 3 characters" })
  @MaxLength(30, { message: "Store handle must be at most 30 characters" })
  @Matches(/^[a-z0-9-_]+$/, { message: "Store handle can only contain lowercase letters, numbers, hyphens, and underscores" })
  handle?: string;
}
