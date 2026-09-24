import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "Name is required" })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(100, { message: "Name must be at most 100 characters long" })
  name!: string;

  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Please enter a valid email" })
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: "Handle must be at least 3 characters" })
  @MaxLength(30, { message: "Handle must be at most 30 characters" })
  @Matches(/^[a-z0-9-_]+$/, { message: "Handle can only contain lowercase letters, numbers, hyphens, and underscores" })
  handle?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @MaxLength(50, { message: "Password must be at most 50 characters long" })
  password!: string;
}
