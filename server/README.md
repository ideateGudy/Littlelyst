# Littlelyst Backend

This directory (`server/`) contains the core backend API for **Littlelyst** built using NestJS, Drizzle ORM, and PostgreSQL. It acts as the financial engine and central API gateway for the application.

---

## What `server/` Does

The backend manages user authentication, wallet creation, financial transactions, and immutable audit logs. It guarantees strict accounting integrity and race-condition safety for all financial operations.

### Key Capabilities & Responsibilities

1. **Authentication & User Management (`src/auth`, `src/users`)**:
   - Handles registration, login, profile retrieval, and secure logout.
   - Issues short-lived JWT Access Tokens (`15m`) and long-lived Refresh Tokens (`7d`) with automatic token rotation and DB hashing.
   - Restricts system-level administrative actions via a custom `SystemUserGuard`.

2. **Wallet & Account Operations (`src/wallets`)**:
   - Manages multi-currency/multi-account financial wallets for users.
   - **SQL-Derived Balances**: Balances are not stored as mutable numbers on the wallet row; instead, they are computed dynamically via SQL `SUM()` queries over debit and credit ledger entries to guarantee accounting accuracy.
   - Supports soft deletion (`CLOSED` status) to preserve historical transactions.

3. **Double-Entry Ledger Engine (`src/ledger`)**:
   - Maintains an append-only double-entry financial ledger (`ledger_entries`).
   - Every financial transaction creates corresponding `DEBIT` and `CREDIT` entries.
   - **Database-Level Immutability**: Protected by a PostgreSQL trigger (`prevent_ledger_mutation`) that blocks any attempt to `UPDATE` or `DELETE` existing entries.

4. **Race-Condition-Safe Transfers (`src/transactions`)**:
   - Implements a 10-step atomic transfer flow between accounts.
   - **Row-Level Locking**: Acquires `SELECT ... FOR UPDATE` locks on involved wallets inside a single database transaction, sorted alphabetically by UUID to prevent deadlocks and double-spend race conditions.
   - **Idempotency Safeguards**: Accepts client idempotency keys, catches Postgres unique constraint violations (`23505`), and short-circuits duplicated requests gracefully.
   - **System Initial Funding**: Includes a system bootstrap endpoint (`/api/transactions/system/initial-funds`) to lazy-fund new system accounts.

5. **Notification Services (`src/email`)**:
   - Sends transactional emails (registration, transfer confirmations, transfer failures) via Gmail OAuth2, falling back safely to console logging when unconfigured.

---

## Prerequisites

- Node.js (v18+)
- [pnpm](https://pnpm.io/)
- Docker & Docker Compose (for the local database and stack)

## Environment Setup

1. Copy the environment variables example file:
   ```bash
   cp .env.example .env
   ```
2. The `docker-compose.yml` is configured to read directly from `.env`. For local development, the defaults in `.env.example` will work out of the box.

## Project Setup

```bash
pnpm install
```

## Running the Database & Server (Docker)

We use Docker Compose to spin up the local PostgreSQL database and application server.

```bash
# Start just the database
docker compose up -d postgres

# Or start the entire stack (Database + NestJS Server)
docker compose up -d
```

## Database Migrations

We use Drizzle ORM to manage the database schema.

```bash
# Generate migration files (if you change the schema)
pnpm run db:generate

# Apply migrations to the database
pnpm run db:push
```

## Compile and run the server locally

If you are running the server locally instead of via Docker Compose:

```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

## Run tests

```bash
# unit tests (includes concurrency race-condition tests)
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

## Core API Route Overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/auth/register` | `POST` | Register a new user account |
| `/api/auth/login` | `POST` | Authenticate user and issue access + refresh tokens |
| `/api/auth/refresh` | `POST` | Rotate and issue a new access/refresh token pair |
| `/api/auth/logout` | `POST` | Revoke user's refresh token |
| `/api/accounts` | `POST` / `GET` | Create or list user wallets |
| `/api/accounts/balance/:accountId` | `GET` | Fetch derived real-time SQL balance for a wallet |
| `/api/transactions` | `POST` | Execute an atomic 10-step money transfer between wallets |
| `/api/transactions/system/initial-funds` | `POST` | Bootstrap initial system wallet funds |
