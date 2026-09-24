import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { UsersService } from "../../users/users.service.js";

export interface JwtPayload {
  userId: string;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (
            request?.cookies?.token ||
            request?.headers?.authorization?.replace("Bearer ", "") ||
            null
          );
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_jwt_access_secret_key_123",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException({
        status: "failed",
        message: "Unauthorized, user not found",
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      handle: user.handle,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      paystackSubaccountCode: user.paystackSubaccountCode,
      role: (user as any).role || "seller",
      systemUser: user.systemUser === true || (user as any).role === "super-admin",
    };
  }
}
