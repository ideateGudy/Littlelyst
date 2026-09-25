import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import session from "express-session";
import express from "express";
import { AppModule } from "../src/app.module.js";
import { AllExceptionsFilter } from "../src/common/filters/http-exception.filter.js";

const expressApp = express();
let cachedServer: any;

async function bootstrapServerless() {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.use(cookieParser());

    const sessionMaxAgeDays = parseInt(
      process.env.SESSION_MAX_AGE_DAYS || "7",
      10,
    );

    app.use(
      session({
        name: "littlelyst.sid",
        secret:
          process.env.SESSION_SECRET ||
          "littlelyst_secret_key_2026_secure_session",
        resave: true,
        saveUninitialized: true,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: sessionMaxAgeDays * 24 * 60 * 60 * 1000,
        },
      }),
    );

    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : true;

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServerless();
  return server(req, res);
}
