import {
  Injectable,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import { wallets, Wallet, NewWallet, ledgerEntries } from "../db/schema.js";
import { CreateWalletDto } from "./dto/create-wallet.dto.js";
import { UpdateWalletDto } from "./dto/update-wallet.dto.js";

@Injectable()
export class WalletsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async createWallet(userId: string, dto: CreateWalletDto): Promise<Wallet> {
    const newWallet: NewWallet = {
      userId,
      currency: dto.currency || "NGN",
      status: "ACTIVE",
    };

    const [row] = await this.db.insert(wallets).values(newWallet).returning();
    return row;
  }

  async getAllWallets(userId: string): Promise<Wallet[]> {
    return this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));
  }

  async getWalletById(userId: string, walletId: string): Promise<Wallet> {
    const [row] = await this.db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException({
        status: "failed",
        message: "Account not found",
      });
    }

    return row;
  }

  async getWalletByIdDirect(walletId: string): Promise<Wallet | undefined> {
    const [row] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.id, walletId))
      .limit(1);
    return row;
  }

  async getBalance(
    walletId: string,
    txClient?: any,
  ): Promise<bigint> {
    const client = txClient || this.db;
    const result = await client.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'CREDIT' THEN amount_minor ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'DEBIT' THEN amount_minor ELSE 0 END), 0) AS balance
      FROM ledger_entries
      WHERE wallet_id = ${walletId}
    `);

    const rawBalance = result.rows[0]?.balance;
    if (rawBalance === undefined || rawBalance === null) {
      return 0n;
    }
    return BigInt(rawBalance);
  }

  async updateWallet(
    userId: string,
    walletId: string,
    dto: UpdateWalletDto,
  ): Promise<Wallet> {
    const wallet = await this.getWalletById(userId, walletId);

    const updateData: Partial<NewWallet> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.currency) updateData.currency = dto.currency;

    const [updated] = await this.db
      .update(wallets)
      .set(updateData)
      .where(and(eq(wallets.id, wallet.id), eq(wallets.userId, userId)))
      .returning();

    return updated;
  }

  async deleteWallet(userId: string, walletId: string): Promise<void> {
    const wallet = await this.getWalletById(userId, walletId);

    // Soft-close wallet to preserve foreign key integrity with ledger entries
    await this.db
      .update(wallets)
      .set({ status: "CLOSED" })
      .where(and(eq(wallets.id, wallet.id), eq(wallets.userId, userId)));
  }
}
