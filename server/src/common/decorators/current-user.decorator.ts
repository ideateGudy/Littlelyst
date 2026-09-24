import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUserPayload {
  id: string;
  email: string;
  name: string;
  handle: string;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  paystackSubaccountCode?: string | null;
  role?: string;
  systemUser: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
