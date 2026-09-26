# Littlelyst Storefront (Client)

The frontend application for Littlelyst, providing dynamic storefronts for merchants, a seamless checkout experience for buyers, and powerful dashboards for administrators.

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Bundler**: Turbopack
- **Styling**: Tailwind CSS + Shadcn UI (Lucide Icons)
- **State Management / Context**: React Hooks & Context API (`useAuth`)
- **Forms**: React Hook Form
- **Data Fetching**: Custom API client wrapper connecting to the NestJS backend

## Core Workflows

### 1. Public & Buyer Workflows
- **Dynamic Storefronts**: Sellers get automatically generated routing for their stores at `/[handle]`.
- **Checkout Auto-fill**: Logged-in buyers automatically have their contact, shipping, and payment details filled during checkout, reducing friction.
- **Order Tracking**: Buyers can securely check the status of their orders.

### 2. Seller Experience
- **Dashboard (`/dashboard`)**: Analytics covering total sales, orders, and products.
- **Product Management**: Ability to upload physical/digital goods, manage stock, and toggle visibility.
- **Light/Dark Mode Support**: The UI seamlessly adapts to the user's system preferences, including intelligently inverted buttons and badges on uploaded product imagery.

### 3. Admin / Super-Admin Console
- **Financial Overview**: Real-time aggregated data on total platform volume, platform fees earned, and total money paid out to sellers.
- **User Management**: Role assignment interface (strictly protected to prevent unauthorized super-admin creation).

## Environment Setup
Ensure you have an `.env.local` file configured:
```env
API_URL=http://localhost:3001
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

## Available Scripts
- `pnpm dev` - Start the Next.js development server with Turbopack
- `pnpm build` - Create an optimized production build
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint checks
