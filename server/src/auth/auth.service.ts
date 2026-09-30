import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
      reminderEmailTemplate: (user as any).reminderEmailTemplate || null,
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't leak that the user doesn't exist to prevent enumeration,
      // just simulate a successful request.
      return { status: "success", message: "If an account exists, a reset code was sent." };
    }
    
    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    this.otpStore.set(email.toLowerCase().trim(), { code, expiresAt });
    
    this.emailService
      .sendOtpEmail(email, code) // We can reuse the OTP email template
      .catch((err) => console.error("Error sending reset OTP email:", err));
      
    console.log(`[EMAIL PASSWORD RESET OTP] Verification code for ${email}: ${code}`);
    
    return { status: "success", message: "If an account exists, a reset code was sent." };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const identifier = email.trim().toLowerCase();
    
    const isValid = this.verifyOtp({ email: identifier }, code);
    if (!isValid) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Invalid or expired reset code",
      });
    }

    const user = await this.usersService.findByEmail(identifier);
    if (!user) {
      throw new NotFoundException({
        status: "failed",
        message: "User not found",
      });
    }

    await this.usersService.updatePassword(user.id, newPassword);

    return {
      status: "success",
      message: "Password reset successfully. You can now log in.",
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
      reminderEmailTemplate?: string;
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
      role: (updated as any).role || "seller",
      systemUser: updated.systemUser === true || (updated as any).role === "super-admin",
      reminderEmailTemplate: (updated as any).reminderEmailTemplate || null,
    };
  }

  async switchRole(
    userId: string,
    targetRole: "seller" | "buyer",
    requestedHandle?: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        status: "failed",
        message: "User not found",
      });
    }

    // Do not allow demoting super-admin or admin via self-service switch
    if (user.role === "super-admin" || user.role === "admin") {
      throw new ConflictException({
        status: "failed",
        message: "Admin accounts cannot switch roles using the customer toggle",
      });
    }

    let finalHandle = user.handle;
    if (targetRole === "seller") {
      // If switching to seller and current handle is missing or generic default, generate/verify
      if (requestedHandle) {
        const clean = requestedHandle.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
        const existing = await this.usersService.findByHandle(clean);
        if (existing && existing.id !== userId) {
          throw new ConflictException({
            status: "failed",
            message: "The requested store handle is already in use",
          });
        }
        finalHandle = clean;
      } else if (!finalHandle || finalHandle.startsWith("buyer")) {
        finalHandle = await this.usersService.generateUniqueHandle(user.name);
      }
    }

    const updated = await this.usersService.updateProfile(userId, {
      role: targetRole,
      handle: finalHandle,
    });

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
      role: (updated as any).role || targetRole,
      systemUser: updated.systemUser === true || (updated as any).role === "super-admin",
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ status: "failed", message: "User not found" });
    }

    const isMatch = await this.usersService.comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Current password is incorrect",
      });
    }

    if (newPassword.length < 8) {
      throw new BadRequestException({
        status: "failed",
        message: "New password must be at least 8 characters",
      });
    }

    await this.usersService.updatePassword(userId, newPassword);
    return { changed: true };
  }
}


