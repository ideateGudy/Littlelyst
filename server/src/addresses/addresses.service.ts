import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
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
}
