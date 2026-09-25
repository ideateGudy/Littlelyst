# Littlelyst Backend (Server)

This is the NestJS backend API powering the Littlelyst e-commerce platform. It handles user authentication, product management, order processing, and highly secure financial ledger operations.

## Technology Stack
- **Framework**: NestJS
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon Serverless Postgres)
- **Payment Gateway**: Paystack integration via Webhooks
- **Authentication**: JWT & Passport

## Key System Architectures

### 1. Robust Financial Ledger
Account balances are never adjusted arbitrarily. Every financial movement generates an immutable double-entry row in the `ledger_entries` table. The platform fee margin is tracked on a per-order basis, matching what the admin dashboard computes under Platform Earned and Store Payouts.

### 2. Race Condition Prevention (`FOR UPDATE` Locking)
When multiple webhooks or simultaneous purchases occur for the same store, concurrent transactions could overwrite the seller's wallet balance. We use PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) during webhook processing. Only one transaction can touch and update a wallet row at any given millisecond. Competing transactions safely queue up and read the most up-to-date balance.

### 3. Idempotency Keys
Webhook providers (like Paystack) may retry events up to 5 times. By indexing unique `idempotency_keys` (keyed by `paystack_tx_${reference}`), duplicate webhooks immediately exit without issuing double credits to the seller's wallet or processing the same order twice.

### 4. Role-Based Access Control (RBAC)
- **Public**: Can browse catalogues and make purchases.
- **Buyer/Seller**: Can access protected routes specific to their resources (orders, dashboards).
- **Admin**: Can access platform-wide analytics and user read-access.
- **Super-Admin**: Exclusive rights to promote/demote users, create admins, and delete accounts.

## Available Scripts
- `pnpm start:dev` - Run the server in watch mode for development
- `pnpm build` - Build the application for production
- `pnpm start:prod` - Run the production build
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:migrate` - Run pending migrations
- `pnpm run db:push` - Push schema changes directly to the database (dev only)
