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

    return drizzle(pool, { schema });
  },
};
