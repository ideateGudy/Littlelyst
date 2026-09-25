# Littlelyst (Ledgerbaz)

Littlelyst is a multi-tenant e-commerce platform that allows merchants to host their personal storefronts, buyers to seamlessly purchase digital or physical goods, and administrators to oversee platform financials and user management.

## Project Architecture

This project is a monorepo consisting of:
- **Client (`/client`)**: A modern frontend built with Next.js (App Router), React, and Tailwind CSS.
- **Server (`/server`)**: A robust backend REST API built with NestJS, Drizzle ORM, and PostgreSQL.

## Core Features
- **Multi-Role Access Control**: 
  - `buyer`: Dedicated Shopper Portal (`/buyer`) with order tracking, digital asset downloads, saved checkout autofill profile (`/buyer/profile`), and no merchant storefront.
  - `seller`: Dedicated merchant dashboard (`/dashboard`) and public storefront (`/[handle]`) to manage products, view orders, and track payouts.
  - `admin`: Accesses the admin console for analytics and financial overviews.
  - `super-admin`: Complete control over the platform, including user role promotion/demotion and account deletion.
- **Financial Ledger System**: Double-entry bookkeeping for tracking store balances securely.
- **Payment Processing**: Integrated with Paystack using secure, idempotent webhooks to handle real-time transactions.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- `pnpm` (v10+ recommended)
- PostgreSQL database (Neon recommended)
- Paystack Account (for API Keys)

### 1. Install Dependencies
From the root directory, install all dependencies for both client and server:
```bash
pnpm install
```

### 2. Environment Variables
Create `.env` files in both the `client` and `server` directories.

**`server/.env`**:
```env
PORT=3001
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require
JWT_SECRET=your_super_secret_jwt_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
FRONTEND_URL=http://localhost:3000
```

**`client/.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

### 3. Database Setup
Run the database migrations to build the schema:
```bash
cd server
pnpm run db:push
# or
pnpm run db:generate
pnpm run db:migrate
```

### 4. Setting up the Super-Admin
The `super-admin` role cannot be created via the API or frontend for security reasons.
1. Register normally through the frontend (`http://localhost:3000/register`) as a seller or buyer.
2. Manually promote your account in your database:
   ```sql
   UPDATE users SET role = 'super-admin', system_user = true WHERE email = 'your_email@example.com';
   ```

### 5. Running the Application
You can run both the client and server concurrently from the root directory if you have a configured workspace script, or run them in separate terminals:

**Terminal 1 (Backend):**
```bash
cd server
pnpm start:dev
```

**Terminal 2 (Frontend):**
```bash
cd client
pnpm dev
```
