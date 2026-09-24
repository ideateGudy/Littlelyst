import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AccessTokenGuard extends AuthGuard("jwt") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1. Check express-session first
    if (req.session?.userId) {
      const sessionUser = req.session.user || {};
      const isSuper =
        sessionUser.systemUser === true ||
        sessionUser.role === "super-admin" ||
        sessionUser.role === "admin";

      req.user = {
        id: req.session.userId,
        email: sessionUser.email || "",
        name: sessionUser.name || "",
        handle: sessionUser.handle || "",
        role: sessionUser.role || (isSuper ? "super-admin" : "seller"),
        systemUser: isSuper,
        avatarUrl: sessionUser.avatarUrl || null,
        phone: sessionUser.phone || null,
        bio: sessionUser.bio || null,
        paystackSubaccountCode: sessionUser.paystackSubaccountCode || null,
      };
      return true;
    }

    // 2. Fallback to Passport JWT Guard
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch {
      return false;
    }
  }
}
