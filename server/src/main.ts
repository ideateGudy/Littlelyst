import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import session from "express-session";
import { AppModule } from "./app.module.js";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const sessionMaxAgeDays = parseInt(process.env.SESSION_MAX_AGE_DAYS || "7", 10);

  // Enable express-session middleware
  app.use(
    session({
      name: "littlelyst.sid",
      secret: process.env.SESSION_SECRET || "littlelyst_secret_key_2026_secure_session",
      resave: true,
      saveUninitialized: true,
      cookie: {
        httpOnly: true, // Prevents XSS script access to session cookie
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionMaxAgeDays * 24 * 60 * 60 * 1000,
      },
    }),
  );

  // Enable CORS with credentials for session cookie support
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

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Littlelyst API server running with express-session on port ${port}`);
}

if (!process.env.VERCEL) {
  await bootstrap();
}
