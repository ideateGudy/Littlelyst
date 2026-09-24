import { Injectable, Inject, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { eq, and, isNull, lt, or, isNotNull } from "drizzle-orm";
import crypto from "crypto";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import { refreshTokens, RefreshToken } from "../db/schema.js";

@Injectable()
export class RefreshTokensService {
  private readonly logger = new Logger(RefreshTokensService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async createRefreshToken(
    userId: string,
    rawToken: string,
    expiresInDays: number = 7,
  ): Promise<RefreshToken> {
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [row] = await this.db
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();

    return row;
  }

  async validateAndRevoke(
    rawToken: string,
  ): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const [existing] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!existing || existing.expiresAt < now) {
      return null;
    }

    // Revoke old token row
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, existing.id));

    return existing;
  }

  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pruneExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.db
        .delete(refreshTokens)
        .where(
          or(
            lt(refreshTokens.expiresAt, now),
            isNotNull(refreshTokens.revokedAt),
          ),
        );
      this.logger.log("Pruned expired and revoked refresh tokens.");
    } catch (error) {
      this.logger.error("Error pruning refresh tokens:", error);
    }
  }
}
