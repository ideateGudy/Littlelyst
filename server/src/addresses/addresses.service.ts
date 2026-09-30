import { Injectable, Inject } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import { addresses } from "./addresses.schema.js";
import type { NewAddress } from "./addresses.schema.js";

@Injectable()
export class AddressesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async listByUser(userId: string) {
    return this.db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.createdAt);
  }

  async create(userId: string, dto: Omit<NewAddress, "id" | "userId" | "createdAt">) {
    const inserted = await this.db
      .insert(addresses)
      .values({ ...dto, userId })
      .returning();
    return inserted[0];
  }

  async update(id: string, userId: string, dto: Partial<NewAddress>) {
    const updated = await this.db
      .update(addresses)
      .set(dto)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    return updated[0];
  }

  async delete(id: string, userId: string) {
    const deleted = await this.db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    return deleted[0];
  }
}
