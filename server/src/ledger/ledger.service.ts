import { Injectable, Inject } from "@nestjs/common";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";


import { ledgerEntries, LedgerEntry, NewLedgerEntry } from "../db/schema.js";

@Injectable()
export class LedgerService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /**
   * Append-only write for ledger entries.
   * No update or delete operations are provided.
   */
  async createEntry(
    entry: NewLedgerEntry,
    txClient?: any,
  ): Promise<LedgerEntry> {
    const client = txClient || this.db;
    const [row] = await client.insert(ledgerEntries).values(entry).returning();
    return row;
  }

  async createEntries(
    entries: NewLedgerEntry[],
    txClient?: any,
  ): Promise<LedgerEntry[]> {
    const client = txClient || this.db;
    return client.insert(ledgerEntries).values(entries).returning();
  }
}
