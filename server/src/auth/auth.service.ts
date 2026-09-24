import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { UsersService } from "../users/users.service.js";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service.js";
import { EmailService } from "../email/email.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly emailService: EmailService,
  ) {}

  private get jwtAccessSecret(): string {
    return (
      process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_SECRET ||
      "default_jwt_access_secret_key_123"
    );
  }

  private get jwtAccessExpires(): string {
    return process.env.JWT_ACCESS_EXPIRES || process.env.JWT_EXPIRES || "15m";
  }

  private get refreshTokenDays(): number {
    return parseInt(
      process.env.REFRESH_TOKEN_EXPIRES_DAYS ||
        process.env.COOKIE_EXPIRES ||
        "7",
      10,
    );
  }

  generateAccessToken(userId: string): string {
    const options: SignOptions = {
      expiresIn: this.jwtAccessExpires as any,
    };
    return jwt.sign({ userId }, this.jwtAccessSecret, options);
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString("hex");
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException({
        status: "failed",
        message: "User already exists",
      });
    }

    const user = await this.usersService.create(registerDto);
    const accessToken = this.generateAccessToken(user.id);
    const rawRefreshToken = this.generateRefreshToken();

    await this.refreshTokensService.createRefreshToken(
      user.id,
      rawRefreshToken,
      this.refreshTokenDays,
    );

    // Fire registration email asynchronously
    this.emailService
      .sendRegistrationEmail(user.email, user.name)
      .catch(() => {});

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        paystackBankName: user.paystackBankName,
        paystackAccountNumber: user.paystackAccountNumber,
        role: (user as any).role || "seller",
        systemUser: user.systemUser === true || (user as any).role === "super-admin",
      },
      token: accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Invalid email or password",
      });
    }

    const isMatch = await this.usersService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Invalid email or password",
      });
    }

    const accessToken = this.generateAccessToken(user.id);
    const rawRefreshToken = this.generateRefreshToken();

    await this.refreshTokensService.createRefreshToken(
      user.id,
      rawRefreshToken,
      this.refreshTokenDays,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        paystackBankName: user.paystackBankName,
        paystackAccountNumber: user.paystackAccountNumber,
        role: (user as any).role || "seller",
        systemUser: user.systemUser === true || (user as any).role === "super-admin",
      },
      token: accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Refresh token is missing",
      });
    }

    const oldToken =
      await this.refreshTokensService.validateAndRevoke(rawRefreshToken);
    if (!oldToken) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Invalid or expired refresh token",
      });
    }

    const user = await this.usersService.findById(oldToken.userId);
    if (!user) {
      throw new UnauthorizedException({
        status: "failed",
        message: "User not found",
      });
    }

    const newAccessToken = this.generateAccessToken(user.id);
    const newRawRefreshToken = this.generateRefreshToken();

    await this.refreshTokensService.createRefreshToken(
      user.id,
      newRawRefreshToken,
      this.refreshTokenDays,
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        paystackBankName: user.paystackBankName,
        paystackAccountNumber: user.paystackAccountNumber,
        role: (user as any).role || "seller",
        systemUser: user.systemUser === true || (user as any).role === "super-admin",
      },
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      await this.refreshTokensService.revokeToken(rawRefreshToken);
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        status: "failed",
        message: "User not found",
      });
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      paystackBankName: user.paystackBankName,
      paystackAccountNumber: user.paystackAccountNumber,
      role: (user as any).role || "seller",
      systemUser: user.systemUser === true || (user as any).role === "super-admin",
    };
  }

  // In-memory OTP store for phone / email verification (identifier -> { code, expiresAt })
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  async sendOtp(target: { phone?: string; email?: string }) {
    const identifier = target.email
      ? target.email.trim().toLowerCase()
      : target.phone
      ? target.phone.trim().replace(/\s+/g, "")
      : "";

    if (!identifier) {
      throw new ConflictException({
        status: "failed",
        message: "Email or phone number is required",
      });
    }

    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    this.otpStore.set(identifier, { code, expiresAt });

    if (target.email) {
      // Send real/mock email via EmailService
      this.emailService
        .sendOtpEmail(identifier, code)
        .catch((err) => console.error("Error sending OTP email:", err));
      console.log(`[EMAIL OTP] Verification code for ${identifier}: ${code}`);
    } else {
      console.log(`[SMS OTP SIMULATION] Verification code for ${identifier}: ${code}`);
    }

    return {
      status: "success",
      message: `Verification code sent to ${identifier}`,
      simulatedCode: target.phone && process.env.NODE_ENV !== "production" ? code : undefined,
    };
  }

  // Backwards compatible method
  async sendPhoneOtp(phone: string) {
    return this.sendOtp({ phone });
  }

  verifyOtp(target: { phone?: string; email?: string }, code: string): boolean {
    const identifier = target.email
      ? target.email.trim().toLowerCase()
      : target.phone
      ? target.phone.trim().replace(/\s+/g, "")
      : "";

    if (!identifier) return false;
    const record = this.otpStore.get(identifier);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(identifier);
      return false;
    }
    const isValid = record.code === code.trim();
    if (isValid) {
      this.otpStore.delete(identifier);
    }
    return isValid;
  }

  // Backwards compatible method
  verifyPhoneOtp(phone: string, code: string): boolean {
    return this.verifyOtp({ phone }, code);
  }

  async suggestHandle(brandOrName: string) {
    const handle = await this.usersService.generateUniqueHandle(brandOrName);
    return { handle };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      handle?: string;
      phone?: string;
      bio?: string;
      avatarUrl?: string;
      paystackBankName?: string;
      paystackAccountNumber?: string;
    },
  ) {
    const updated = await this.usersService.updateProfile(userId, data);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      handle: updated.handle,
      phone: updated.phone,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      paystackBankName: updated.paystackBankName,
      paystackAccountNumber: updated.paystackAccountNumber,
    };
  }
}
