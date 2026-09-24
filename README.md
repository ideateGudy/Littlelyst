# Littlelyst — Social-Commerce & Instant Catalogue Platform

> **Fast, mobile-first social commerce catalogue with instant Paystack checkout, promo flash countdowns, store analytics, and super-admin financial controls.**

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack & Architecture](#-tech-stack--architecture)
4. [Directory Structure](#-directory-structure)
5. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
6. [Environment Variables Configuration](#-environment-variables-configuration)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Database Schema & Models](#-database-schema--models)
9. [Deployment & Production Build](#-deployment--production-build)

---

## 🌟 Project Overview

**Littlelyst** is an end-to-end social commerce engine designed for merchants to launch a light/dark mode online store catalogue in seconds. Customers can browse products, view live Instagram-style promotion stories, apply discount coupons, and complete friction-free instant checkouts via Paystack without creating an account.

For merchants and administrators, Littlelyst provides real-time sales dashboards, order fulfillment status management (Pending, Paid, Delivered, Cancelled), conversion tracking, traffic source analytics, and platform fee oversight.

---

## ⚡ Key Features

### 🛍️ Storefront & Buyer Flow
- **Instant Paystack Checkout**: Frictionless guest checkout supporting Debit/Credit Cards, Bank Transfer, USSD, and Mobile Money wallets via Paystack Inline.
- **Promo-Only Store Stories**: Instagram-style tap-through story stories scoped exclusively to products with active promotional flash sales.
- **Product Type Differentiation**: Native support for both **Physical Items** (with inventory stock tracking) and **Digital Downloads/Key Access**.
- **Real-Time Countdown Timers**: Live countdown timers for promotional sales with custom discount badges.
- **Category Filtering & Search**: Clean category pill navigation and instant live search.

### 📊 Merchant Dashboard
- **Product Management**: Create, edit, draft/publish, or delete products with Cloudinary image uploads.
- **Order Fulfillment Management**: Track orders with statuses (`PENDING`, `PAID`, `FULFILLED` / Delivered, `CANCELLED`, `FAILED`) and update fulfillment in one click.
- **Sales Analytics**: Visual 7-day revenue trend bar charts, conversion rate metrics, and buyer click traffic channel breakdown (WhatsApp Status, Instagram Bio, Google Business, Direct).
- **Store Details & Storefront Handles**: Customize store name, bio, profile avatar, and custom store link handles (`littlelyst.com/your-store`).

### 🛡️ Super-Admin Console
- **Platform Financial Earnings**: Track total platform fees earned (`platformFeeMinor`), gross sales volume (`GMV`), and total payouts sent to stores (`sellerNetMinor`).
- **Store Directory**: Overview of all registered merchant accounts, product tallies, order volume, and per-store revenue.
- **User Role Management**: Assign and manage platform roles (`seller`, `admin`, `super-admin`).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - **Framework**: Next.js 16 (App Router, Turbopack)
  - **UI Library & Styling**: React 19, Tailwind CSS v4, Motion (Framer Motion)
  - **Icons & Theme**: Lucide React, Next-Themes (Light / Dark Mode support)
  - **Client Compression**: `browser-image-compression` for fast image uploads

- **Backend**:
  - **Framework**: NestJS 12 (Express Engine)
  - **Database & ORM**: PostgreSQL (Neon Serverless Cloud DB) with Drizzle ORM
  - **Authentication**: Dual-layer Express Session + JWT HTTP-only cookie guards
  - **Payments**: Paystack Gateway API Integration (Webhooks + Inline Popup)
  - **Storage & Email**: Cloudinary Media API + Gmail SMTP Email Delivery

---

## 📂 Directory Structure

```
Ledgerbaz/
├── client/                     # Next.js 16 Frontend Application
│   ├── app/
│   │   ├── (dashboard)/        # Merchant & Admin Dashboard pages
│   │   │   ├── admin/          # Super-Admin financial console
│   │   │   ├── dashboard/      # Merchant catalogue & orders dashboard
│   │   │   │   ├── new/        # Add product form
│   │   │   │   └── orders/     # Order fulfillment manager
│   │   │   └── layout.tsx      # Dashboard navigation bar
│   │   ├── [handle]/           # Public Storefront & Story View
│   │   ├── login/              # Login page
│   │   └── register/           # Merchant registration
│   ├── components/             # Reusable UI components & theme toggles
│   ├── lib/                    # API Client, Auth Context & Utilities
│   └── package.json
│
├── server/                     # NestJS 12 Backend API Server
│   ├── src/
│   │   ├── admin/              # Admin overview & store management
│   │   ├── analytics/          # Traffic source & event analytics
│   │   ├── auth/               # User authentication, guards & JWT strategies
│   │   ├── catalogue/          # Public storefront API handlers
│   │   ├── db/                 # Drizzle ORM schema definitions & migrations
│   │   ├── orders/             # Order checkout & status updates
│   │   ├── payments/           # Paystack gateway & webhook verification
│   │   ├── products/           # Product CRUD & inventory management
│   │   ├── promotions/         # Flash sales & discount coupon validation
│   │   ├── uploads/            # Cloudinary media upload handler
│   │   └── users/              # User profiles & store settings
│   ├── scripts/                # Database seed & migration scripts
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Database**: PostgreSQL connection URI (Neon PostgreSQL or local instance)

### Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure your `.env` file (see [Environment Variables Configuration](#-environment-variables-configuration)).
4. Run database migrations:
   ```bash
   pnpm drizzle-kit push
   ```
5. Start the backend development server:
   ```bash
   pnpm start:dev
   ```
   The backend server will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure your `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   pnpm dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 🔑 Environment Variables Configuration

### Server (`server/.env`)
```env
# Server
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_secure_session_secret_key

# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=verify-full

# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Paystack API Keys
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email / SMTP
EMAIL_USER=your_email@gmail.com
```

---

## 📋 API Endpoints Reference

### Public Storefront (`/api/catalogue`)
- `GET /api/catalogue/:handle`: Retrieve storefront products, seller bio, and active promotions.
- `GET /api/catalogue/:handle/products/:slug`: Retrieve single product details.

### Orders & Checkout (`/api/orders`)
- `POST /api/orders/checkout`: Initialize guest checkout for payment.
- `GET /api/orders/reference/:reference`: Get order confirmation and digital file access.
- `GET /api/orders`: List seller's orders (Merchant Protected).
- `POST /api/orders/:id/status`: Update fulfillment status (`PENDING`, `PAID`, `FULFILLED`, `CANCELLED`) (Merchant Protected).

### Products (`/api/products`)
- `GET /api/products`: List merchant's products.
- `POST /api/products`: Create a new product.
- `PUT /api/products/:id`: Update product or toggle draft/public status.
- `DELETE /api/products/:id`: Delete product.

### Super-Admin (`/api/admin`)
- `GET /api/admin/overview`: Platform financial summary (GMV, platform fee profit, store payouts).
- `GET /api/admin/users`: List all merchant store accounts and per-store earnings.
- `PUT /api/admin/users/:id/role`: Update account role (`seller`, `admin`, `super-admin`).

---

## 📊 Database Schema & Models

Primary PostgreSQL tables defined with **Drizzle ORM** in `server/src/db/schema.ts`:

- `users`: Store owners and admin staff (`id`, `name`, `email`, `handle`, `role`, `systemUser`, `avatarUrl`, `paystackBankName`).
- `products`: Physical and digital catalog listings (`id`, `sellerId`, `title`, `slug`, `priceMinor`, `stockQuantity`, `productType`, `visibility`).
- `promotions`: Flash sale promotions (`id`, `productId`, `discountedPriceMinor`, `startAt`, `endAt`, `isActive`).
- `coupons`: Discount code vouchers (`id`, `sellerId`, `code`, `discountType`, `discountValue`, `maxRedemptions`).
- `orders`: Transaction records (`id`, `sellerId`, `productId`, `buyerName`, `buyerEmail`, `buyerPhone`, `totalMinor`, `sellerNetMinor`, `platformFeeMinor`, `status`, `paystackReference`).

---

## 🛠️ Deployment & Production Build

### Building Frontend:
```bash
cd client
pnpm run build
```

### Building Backend:
```bash
cd server
pnpm run build
```

Both build commands generate optimized production output with zero TypeScript or bundling errors.
