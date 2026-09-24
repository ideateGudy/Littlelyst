import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { eq, and, or, desc, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";

import {
  transactions,
  wallets,
  Transaction,
  NewTransaction,
  NewLedgerEntry,
} from "../db/schema.js";
import { WalletsService } from "../wallets/wallets.service.js";
import { LedgerService } from "../ledger/ledger.service.js";
import { EmailService } from "../email/email.service.js";
import {
  CreateTransactionDto,
  CreateInitialFundsDto,
} from "./dto/create-transaction.dto.js";

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly walletsService: WalletsService,
    private readonly ledgerService: LedgerService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Safe parser for amountMinor into bigint.
   * Disallows negative or fractional amounts.
   */
  private parseAmountMinor(amount: string | number): bigint {
    try {
      const amtStr = String(amount).trim();
      if (!amtStr || isNaN(Number(amtStr))) {
        throw new BadRequestException({
          status: "failed",
          message: "Invalid transaction amount",
        });
      }
      const val = BigInt(amtStr.split(".")[0]);
      if (val <= 0n) {
        throw new BadRequestException({
          status: "failed",
          message: "Transaction amount must be greater than zero",
        });
      }
      return val;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException({
        status: "failed",
        message: "Invalid transaction amount format",
      });
    }
  }

  /**
   * The 10-step transfer flow with row-level locking and idempotency.
   */
  async createTransaction(
    dto: CreateTransactionDto,
    currentUser: { id: string; email: string; name: string },
  ) {
    const { fromAccount, toAccount } = dto;
    const idempotencyKey = dto.idempotencyKey || uuidv4();
    const amountMinor = this.parseAmountMinor(dto.amount);

    if (fromAccount === toAccount) {
      throw new BadRequestException({
        status: "failed",
        message: "Sender and receiver accounts cannot be the same",
      });
    }

    // Step 1: Cheap short-circuit idempotency check (before acquiring any lock)
    const existing = await this.db.query.transactions.findFirst({
      where: eq(transactions.idempotencyKey, idempotencyKey),
    });

    if (existing) {
      return this.handleExistingTransaction(existing);
    }

    // Verify both accounts exist upfront
    const fromUserAccount =
      await this.walletsService.getWalletByIdDirect(fromAccount);
    const toUserAccount =
      await this.walletsService.getWalletByIdDirect(toAccount);

    if (!fromUserAccount || !toUserAccount) {
      throw new BadRequestException({
        status: "failed",
        message: "Invalid sender or reciever account",
      });
    }

    if (fromUserAccount.userId !== currentUser.id) {
      throw new BadRequestException({
        status: "failed",
        message: "Sender account does not belong to authenticated user",
      });
    }

    if (
      fromUserAccount.status !== "ACTIVE" ||
      toUserAccount.status !== "ACTIVE"
    ) {
      throw new BadRequestException({
        status: "failed",
        message: "Both accounts must be active to perform a transaction",
      });
    }

    let createdTransaction: Transaction | null = null;

    try {
      // Execute within a single PostgreSQL transaction with row-level locks
      await this.db.transaction(async (tx) => {
        // Lock sender and receiver in consistent UUID ascending order to avoid deadlocks
        const sortedIds = [fromAccount, toAccount].sort();
        for (const id of sortedIds) {
          await tx.execute(
            sql`SELECT id FROM wallets WHERE id = ${id} FOR UPDATE`,
          );
        }

        // Re-check account status inside transaction lock
        const [lockedFrom] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.id, fromAccount));
        const [lockedTo] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.id, toAccount));

        if (
          !lockedFrom ||
          !lockedTo ||
          lockedFrom.status !== "ACTIVE" ||
          lockedTo.status !== "ACTIVE"
        ) {
          throw new BadRequestException({
            status: "failed",
            message: "Both accounts must be active to perform a transaction",
          });
        }

        // Step 4: Derive sender balance while holding row lock
        const balance = await this.walletsService.getBalance(fromAccount, tx);
        if (balance < amountMinor) {
          throw new BadRequestException({
            status: "failed",
            message: `Insufficient balance. Available balance: ${balance}. Requested amount: ${amountMinor}`,
          });
        }

        // Step 5: Insert Transaction (PENDING)
        const newTx: NewTransaction = {
          fromWalletId: fromAccount,
          toWalletId: toAccount,
          amountMinor,
          status: "PENDING",
          idempotencyKey,
        };

        const [txRow] = await tx
          .insert(transactions)
          .values(newTx)
          .returning();

        // Step 6: Create DEBIT ledger entry
        const debitEntry: NewLedgerEntry = {
          walletId: fromAccount,
          transactionId: txRow.id,
          type: "DEBIT",
          amountMinor,
        };
        await this.ledgerService.createEntry(debitEntry, tx);

        // Step 7: Create CREDIT ledger entry
        const creditEntry: NewLedgerEntry = {
          walletId: toAccount,
          transactionId: txRow.id,
          type: "CREDIT",
          amountMinor,
        };
        await this.ledgerService.createEntry(creditEntry, tx);

        // Step 8: Update Transaction to COMPLETED
        const [completedTx] = await tx
          .update(transactions)
          .set({ status: "COMPLETED" })
          .where(eq(transactions.id, txRow.id))
          .returning();

        createdTransaction = completedTx;
      });
    } catch (error: any) {
      // Catch concurrent unique-constraint violation (code 23505) on idempotencyKey
      if (error?.code === "23505") {
        const existingTx = await this.db.query.transactions.findFirst({
          where: eq(transactions.idempotencyKey, idempotencyKey),
        });
        if (existingTx) {
          return this.handleExistingTransaction(existingTx);
        }
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error("Transaction failed during execution:", error);
      throw new BadRequestException({
        status: "pending",
        message:
          "Transaction is Pending due to some issue, please retry after sometime",
      });
    }

    // Step 10: Send transaction email notification asynchronously
    if (createdTransaction) {
      this.emailService
        .sendTransactionEmail(
          currentUser.email,
          currentUser.name,
          amountMinor,
          toAccount,
        )
        .catch(() => {});
    }

    return {
      statusCode: 201,
      response: {
        status: "success",
        message: "Transaction completed successfully",
        transaction: this.formatTransaction(createdTransaction!),
      },
    };
  }

  /**
   * Lazy-funded system initial funds transaction.
   */
  async createInitialFundsTransaction(
    dto: CreateInitialFundsDto,
    currentUser: { id: string; email: string; name: string },
  ) {
    const { toAccount } = dto;
    const idempotencyKey = dto.idempotencyKey || uuidv4();
    const amountMinor = this.parseAmountMinor(dto.amount);

    const toUserAccount =
      await this.walletsService.getWalletByIdDirect(toAccount);
    if (!toUserAccount) {
      throw new BadRequestException({
        status: "failed",
        message: "Invalid user account",
      });
    }

    // Check if system user has an existing wallet, or lazily create and fund it
    let [systemWallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, currentUser.id))
      .limit(1);

    if (!systemWallet) {
      await this.db.transaction(async (tx) => {
        const [newWallet] = await tx
          .insert(wallets)
          .values({
            userId: currentUser.id,
            status: "ACTIVE",
            currency: "NGN",
          })
          .returning();

        systemWallet = newWallet;

        // Seed with 1,000,000,000 minor units
        const seedAmount = 1000000000n;
        const [seedTx] = await tx
          .insert(transactions)
          .values({
            fromWalletId: newWallet.id,
            toWalletId: newWallet.id,
            amountMinor: seedAmount,
            idempotencyKey: uuidv4(),
            status: "COMPLETED",
          })
          .returning();

        await this.ledgerService.createEntry(
          {
            walletId: newWallet.id,
            transactionId: seedTx.id,
            type: "CREDIT",
            amountMinor: seedAmount,
          },
          tx,
        );
      });
    }

    let finalTx: Transaction | null = null;

    try {
      await this.db.transaction(async (tx) => {
        // Lock both wallets in sorted order
        const sorted = [systemWallet.id, toAccount].sort();
        for (const id of sorted) {
          await tx.execute(
            sql`SELECT id FROM wallets WHERE id = ${id} FOR UPDATE`,
          );
        }

        const [txRow] = await tx
          .insert(transactions)
          .values({
            fromWalletId: systemWallet.id,
            toWalletId: toAccount,
            amountMinor,
            idempotencyKey,
            status: "PENDING",
          })
          .returning();

        await this.ledgerService.createEntry(
          {
            walletId: systemWallet.id,
            transactionId: txRow.id,
            type: "DEBIT",
            amountMinor,
          },
          tx,
        );

        await this.ledgerService.createEntry(
          {
            walletId: toAccount,
            transactionId: txRow.id,
            type: "CREDIT",
            amountMinor,
          },
          tx,
        );

        const [completed] = await tx
          .update(transactions)
          .set({ status: "COMPLETED" })
          .where(eq(transactions.id, txRow.id))
          .returning();

        finalTx = completed;
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        const existingTx = await this.db.query.transactions.findFirst({
          where: eq(transactions.idempotencyKey, idempotencyKey),
        });
        if (existingTx) {
          return this.handleExistingTransaction(existingTx);
        }
      }
      this.logger.error("Initial funds transaction failed:", error);
      throw new BadRequestException({
        status: "failed",
        message: "Internal server error",
      });
    }

    return {
      statusCode: 201,
      response: {
        status: "success",
        message: "Initial funds added successfully",
        transaction: this.formatTransaction(finalTx!),
      },
    };
  }

  async getAllTransactions(userId: string) {
    // Join through the user's own accounts (fixing bug #7)
    const userWallets = await this.walletsService.getAllWallets(userId);
    const walletIds = userWallets.map((w) => w.id);

    if (walletIds.length === 0) {
      return {
        status: "success",
        message: "Transactions retrieved successfully",
        data: { transactions: [] },
      };
    }

    const txs = await this.db
      .select()
      .from(transactions)
      .where(
        or(
          inArray(transactions.fromWalletId, walletIds),
          inArray(transactions.toWalletId, walletIds),
        ),
      )
      .orderBy(desc(transactions.createdAt));

    return {
      status: "success",
      message: "Transactions retrieved successfully",
      data: { transactions: txs.map((t) => this.formatTransaction(t)) },
    };
  }

  async getTransactionById(userId: string, txId: string) {
    const userWallets = await this.walletsService.getAllWallets(userId);
    const walletIds = userWallets.map((w) => w.id);

    if (walletIds.length === 0) {
      throw new NotFoundException({
        status: "failed",
        message: "Transaction not found",
      });
    }

    const [tx] = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, txId),
          or(
            inArray(transactions.fromWalletId, walletIds),
            inArray(transactions.toWalletId, walletIds),
          ),
        ),
      )
      .limit(1);

    if (!tx) {
      throw new NotFoundException({
        status: "failed",
        message: "Transaction not found",
      });
    }

    return {
      status: "success",
      message: "Transaction retrieved successfully",
      data: { transaction: this.formatTransaction(tx) },
    };
  }

  private handleExistingTransaction(tx: Transaction) {
    const formatted = this.formatTransaction(tx);
    if (tx.status === "COMPLETED") {
      return {
        statusCode: 200,
        response: {
          status: "success",
          message: "Transaction already completed",
          transaction: formatted,
        },
      };
    }

    if (tx.status === "PENDING") {
      return {
        statusCode: 200,
        response: {
          status: "success",
          message: "Transaction is still processing",
          transaction: formatted,
        },
      };
    }

    if (tx.status === "FAILED") {
      throw new ConflictException({
        status: "failed",
        message: "Transaction failed previously",
        transaction: formatted,
      });
    }

    if (tx.status === "REVERSED") {
      throw new ConflictException({
        status: "failed",
        message: "Transaction reversed previously",
        transaction: formatted,
      });
    }

    return {
      statusCode: 200,
      response: {
        status: "success",
        transaction: formatted,
      },
    };
  }

  private formatTransaction(tx: Transaction) {
    return {
      _id: tx.id,
      id: tx.id,
      fromAccount: tx.fromWalletId,
      toAccount: tx.toWalletId,
      amount: tx.amountMinor.toString(),
      status: tx.status,
      idempotencyKey: tx.idempotencyKey,
      createdAt: tx.createdAt,
    };
  }
}
