import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { TransactionsService } from "./transactions.service.js";

describe("TransactionsService Concurrency & Race-Condition Safety", () => {
  let transactionsService: TransactionsService;
  let mockDb: any;
  let mockWalletsService: any;
  let mockLedgerService: any;
  let mockEmailService: any;

  beforeEach(() => {
    mockWalletsService = {
      getWalletByIdDirect: vi.fn(),
      getBalance: vi.fn(),
    };
    mockLedgerService = {
      createEntry: vi.fn().mockResolvedValue({ id: "entry-1" }),
    };
    mockEmailService = {
      sendTransactionEmail: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("demonstrates race-condition safety: serializes concurrent transfers so only 1 succeeds when balance allows 1", async () => {
    const senderWalletId = "00000000-0000-0000-0000-000000000001";
    const receiverWalletId = "00000000-0000-0000-0000-000000000002";
    const senderUser = {
      id: "00000000-0000-0000-0000-00000000000a",
      email: "sender@example.com",
      name: "Sender",
    };

    mockWalletsService.getWalletByIdDirect.mockImplementation((id: string) => {
      if (id === senderWalletId) {
        return Promise.resolve({
          id: senderWalletId,
          userId: senderUser.id,
          status: "ACTIVE",
          currency: "NGN",
        });
      }
      if (id === receiverWalletId) {
        return Promise.resolve({
          id: receiverWalletId,
          userId: "00000000-0000-0000-0000-00000000000b",
          status: "ACTIVE",
          currency: "NGN",
        });
      }
      return Promise.resolve(null);
    });

    // In a real Postgres database, SELECT ... FOR UPDATE serializes access to the row.
    // We simulate the Postgres transaction queue + mutex lock:
    let isRowLocked = false;
    const lockWaitQueue: (() => void)[] = [];

    const acquireRowLock = async () => {
      if (isRowLocked) {
        await new Promise<void>((resolve) => lockWaitQueue.push(resolve));
      }
      isRowLocked = true;
    };

    const releaseRowLock = () => {
      isRowLocked = false;
      if (lockWaitQueue.length > 0) {
        const next = lockWaitQueue.shift();
        next?.();
      }
    };

    // Sender starts with balance = 1000 minor units (kobo/cents).
    // Each transfer attempts to send 1000 minor units.
    let derivedBalance = 1000n;

    mockWalletsService.getBalance.mockImplementation(async () => {
      return derivedBalance;
    });

    mockDb = {
      query: {
        transactions: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      transaction: async (cb: (tx: any) => Promise<any>) => {
        // Step 2 of transfer flow: take row-level lock on wallets
        await acquireRowLock();
        try {
          const fakeTx = {
            execute: vi.fn().mockResolvedValue({ rows: [] }),
            select: () => ({
              from: () => ({
                where: () => [
                  {
                    id: senderWalletId,
                    status: "ACTIVE",
                  },
                ],
              }),
            }),
            insert: () => ({
              values: () => ({
                returning: () => [{ id: "tx-1", status: "PENDING" }],
              }),
            }),
            update: () => ({
              set: () => ({
                where: () => ({
                  returning: () => [
                    {
                      id: "tx-1",
                      fromWalletId: senderWalletId,
                      toWalletId: receiverWalletId,
                      amountMinor: 1000n,
                      status: "COMPLETED",
                      idempotencyKey: "key-concurrent",
                      createdAt: new Date(),
                    },
                  ],
                }),
              }),
            }),
          };

          const res = await cb(fakeTx);
          // When transfer commits, the balance is debited
          derivedBalance -= 1000n;
          return res;
        } finally {
          releaseRowLock();
        }
      },
    };

    transactionsService = new TransactionsService(
      mockDb,
      mockWalletsService,
      mockLedgerService,
      mockEmailService,
    );

    // Fire 5 concurrent transfer requests against the wallet with balance for only 1
    const CONCURRENT_REQUESTS = 5;
    const transferAmount = 1000;

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) =>
      transactionsService
        .createTransaction(
          {
            fromAccount: senderWalletId,
            toAccount: receiverWalletId,
            amount: transferAmount,
            idempotencyKey: `race-key-${idx}`,
          },
          senderUser,
        )
        .then((result) => ({ success: true, result }))
        .catch((error) => ({ success: false, error })),
    );

    const outcomes = await Promise.all(promises);

    const successes = outcomes.filter((o) => o.success);
    const failures = outcomes.filter((o) => !o.success);

    // Assert exactly 1 succeeds
    expect(successes).toHaveLength(1);
    expect(successes[0].result?.statusCode).toBe(201);
    expect(successes[0].result?.response?.status).toBe("success");

    // Assert the other 4 fail cleanly with insufficient balance
    expect(failures).toHaveLength(4);
    for (const failure of failures) {
      expect(failure.error).toBeInstanceOf(BadRequestException);
      const resp = (failure.error as BadRequestException).getResponse() as any;
      expect(resp.status).toBe("failed");
      expect(resp.message).toContain("Insufficient balance");
    }

    // Final balance is 0n and never corrupted below zero
    expect(derivedBalance).toBe(0n);
  });
});
