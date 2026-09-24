import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query(
    `UPDATE users SET role = 'super-admin', "system_user" = true WHERE email = 'useprizia@gmail.com' RETURNING id, name, email, role, "system_user"`
  );
  console.log("Updated user to super-admin:", result.rows);
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
