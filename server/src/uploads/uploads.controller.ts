import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { UploadsService } from "./uploads.service.js";
import { AccessTokenGuard } from "../common/guards/jwt-auth.guard.js";

@Controller("api/uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("signature")
  @HttpCode(HttpStatus.OK)
  async getSignature(@Body() body: { folder?: string }) {
    const data = this.uploadsService.generateUploadSignature(body?.folder);
    return {
      status: "success",
      message: "Upload signature generated",
      data,
    };
  }
}
