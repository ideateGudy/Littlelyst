import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class SystemUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isSuperAdmin =
      user &&
      (user.systemUser === true ||
        user.role === "super-admin");

    const isAdmin = user && (isSuperAdmin || user.role === "admin");

    if (!isAdmin) {
      throw new ForbiddenException({
        status: "failed",
        message: "Forbidden, admin or super-admin privileges required",
      });
    }

    return true;
  }
}
