import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";
import {
  CurrentUser,
} from "../common/decorators/current-user.decorator.js";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator.js";

const COOKIE_EXPIRES = process.env.COOKIE_EXPIRES || "7";
const NODE_ENV = process.env.NODE_ENV;

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, token: string, refreshToken: string) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Save express-session
    const session = (req as any).session;
    if (session) {
      session.userId = result.user.id;
      session.user = result.user;
      await new Promise<void>((resolve) => session.save(() => resolve()));
    }

    // Set dual-layer HTTP-Only Cookies
    this.setAuthCookies(res, result.token, result.refreshToken);

    return {
      status: "success",
      message: "User registered successfully",
      user: result.user,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Save express-session
    const session = (req as any).session;
    if (session) {
      session.userId = result.user.id;
      session.user = result.user;
      await new Promise<void>((resolve) => session.save(() => resolve()));
    }

    // Set dual-layer HTTP-Only Cookies
    this.setAuthCookies(res, result.token, result.refreshToken);

    return {
      status: "success",
      message: "User logged in successfully",
      user: result.user,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = (req as any).session;

    // 1. Check refresh token from HTTP-only cookie or request body
    const rawRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken && !session?.userId) {
      throw new UnauthorizedException("No active session or refresh token provided");
    }

    if (rawRefreshToken) {
      try {
        const result = await this.authService.refresh(rawRefreshToken);

        if (session) {
          session.userId = result.user.id;
          session.user = result.user;
          await new Promise<void>((resolve) => session.save(() => resolve()));
        }

        this.setAuthCookies(res, result.token, result.refreshToken);

        return {
          status: "success",
          message: "Token refreshed successfully",
          user: result.user,
        };
      } catch (err) {
        // Fallback to active session
      }
    }

    if (session && session.userId) {
      const user = await this.authService.getCurrentUser(session.userId);
      const newAccessToken = this.authService.generateAccessToken(user.id);
      const newRefreshToken = this.authService.generateRefreshToken();

      this.setAuthCookies(res, newAccessToken, newRefreshToken);

      return {
        status: "success",
        message: "Session refreshed successfully",
        user,
      };
    }

    throw new UnauthorizedException("Session expired. Please log in again.");
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = (req as any).session;
    if (session) {
      await new Promise<void>((resolve) => {
        session.destroy(() => resolve());
      });
    }

    res.clearCookie("littlelyst.sid");
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return {
      status: "success",
      message: "User logged out successfully",
    };
  }

  @Get("current-user")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async currentUser(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    const userId = user?.id || (req as any).session?.userId;
    if (!userId) {
      throw new UnauthorizedException({ status: "failed", message: "No active session" });
    }

    const data = await this.authService.getCurrentUser(userId);

    // Update session user cache
    if ((req as any).session) {
      (req as any).session.user = data;
    }

    return {
      status: "success",
      message: "Session user retrieved successfully",
      user: data,
    };
  }

  @Get("session")
  @HttpCode(HttpStatus.OK)
  async getSession(@Req() req: Request) {
    const session = (req as any).session;
    if (session && session.userId) {
      const user = await this.authService.getCurrentUser(session.userId);
      return {
        status: "success",
        authenticated: true,
        user,
      };
    }

    return {
      status: "success",
      authenticated: false,
      user: null,
    };
  }

  @Post("send-otp")
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: { phone?: string; email?: string }) {
    return this.authService.sendOtp(body);
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { phone?: string; email?: string; code: string }) {
    const isValid = this.authService.verifyOtp(body, body.code);
    return {
      status: isValid ? "success" : "failed",
      valid: isValid,
      message: isValid ? "Verification successful" : "Invalid or expired verification code",
    };
  }

  @Get("suggest-handle")
  @HttpCode(HttpStatus.OK)
  async suggestHandle(@Req() req: Request) {
    const brand = (req.query.brand as string) || "store";
    return this.authService.suggestHandle(brand);
  }

  @Post("profile")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      handle?: string;
      phone?: string;
      bio?: string;
      avatarUrl?: string;
      paystackBankName?: string;
      paystackAccountNumber?: string;
    },
  ) {
    const userId = user?.id || (req as any).session?.userId;
    const updated = await this.authService.updateProfile(userId, body);

    if ((req as any).session) {
      (req as any).session.user = updated;
    }

    return {
      status: "success",
      message: "Profile updated successfully",
      user: updated,
    };
  }
}
