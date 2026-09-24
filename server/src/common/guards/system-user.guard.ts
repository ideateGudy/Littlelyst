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
        user.role === "super-admin" ||
        user.role === "admin" ||
        user.email === "useprizia@gmail.com");

    if (!isSuperAdmin) {
      throw new ForbiddenException({
        status: "failed",
        message: "Forbidden, super-admin privileges required",
      });
    }

    return true;
  }
}
