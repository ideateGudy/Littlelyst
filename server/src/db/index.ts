import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

export const DRIZZLE = Symbol("DRIZZLE");

export type DrizzleDb = NodePgDatabase<typeof schema>;

export const dbProvider = {
  provide: DRIZZLE,
  useFactory: () => {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/littlelyst";
    const isProduction = process.env.NODE_ENV === "production";

    const pool = new Pool({
      connectionString,
      ssl:
        isProduction || connectionString.includes("neon.tech")
          ? { rejectUnauthorized: false }
          : false,
    });

    pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(50) DEFAULT 'seller' NOT NULL;").catch(() => {});
    pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price_minor bigint;").catch(() => {});
    pool.query("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_items integer;").catch(() => {});
    pool.query("ALTER TABLE promotions ADD COLUMN IF NOT EXISTS items_sold integer DEFAULT 0 NOT NULL;").catch(() => {});

    return drizzle(pool, { schema });
  },
};
