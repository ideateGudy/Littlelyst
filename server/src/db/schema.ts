import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  bigint,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const accountStatus = pgEnum("account_status", [
  "ACTIVE",
  "FROZEN",
  "CLOSED",
]);
export const currency = pgEnum("currency", ["NGN", "USD", "EUR"]);
export const txStatus = pgEnum("tx_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REVERSED",
]);
export const ledgerType = pgEnum("ledger_type", ["CREDIT", "DEBIT"]);
export const userRole = pgEnum("user_role", ["seller", "admin", "super-admin", "buyer"]);

export const productType = pgEnum("product_type", ["PHYSICAL", "DIGITAL"]);
export const productVisibility = pgEnum("product_visibility", [
  "PUBLIC",
  "UNLISTED",
  "DRAFT",
]);
export const discountType = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "OVERRIDE_PRICE",
]);
export const orderStatus = pgEnum("order_status", [
  "PENDING",
  "PAID",
  "FULFILLED",
  "CANCELLED",
  "FAILED",
]);
export const paymentChannel = pgEnum("payment_channel", [
  "CARD",
  "BANK_TRANSFER",
  "USSD",
  "MOBILE_MONEY",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  handle: varchar("handle", { length: 50 }).notNull().unique(),
  bio: varchar("bio", { length: 500 }),
  avatarUrl: varchar("avatar_url", { length: 1000 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRole("role").notNull().default("seller"),
  systemUser: boolean("system_user").notNull().default(false),
  paystackSubaccountCode: varchar("paystack_subaccount_code", { length: 100 }),
  paystackBankName: varchar("paystack_bank_name", { length: 100 }),
  paystackAccountNumber: varchar("paystack_account_number", { length: 30 }),
  commissionPercent: integer("commission_percent").notNull().default(5), // 5% default
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: varchar("description", { length: 3000 }),
    priceMinor: bigint("price_minor", { mode: "bigint" }).notNull(),
    discountPriceMinor: bigint("discount_price_minor", { mode: "bigint" }),
    currency: currency("currency").notNull().default("NGN"),
    productType: productType("product_type").notNull().default("PHYSICAL"),
    visibility: productVisibility("visibility").notNull().default("PUBLIC"),
    images: varchar("images", { length: 2048 }).array(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    digitalFileUrl: varchar("digital_file_url", { length: 2048 }),
    digitalKeyOrNote: varchar("digital_key_or_note", { length: 2048 }),
    hasVariants: boolean("has_variants").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_seller_visibility_idx").on(t.sellerId, t.visibility),
    index("products_seller_slug_idx").on(t.sellerId, t.slug),
  ],
);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  title: varchar("title", { length: 100 }).notNull(), // e.g. "Size XL / Blue"
  priceDeltaMinor: bigint("price_delta_minor", { mode: "bigint" }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  sku: varchar("sku", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    discountedPriceMinor: bigint("discounted_price_minor", { mode: "bigint" }).notNull(),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at").notNull(),
    maxItems: integer("max_items"), // optional limit for promo stock (e.g., 10)
    itemsSold: integer("items_sold").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("promotions_product_active_idx").on(t.productId, t.isActive, t.endAt)],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    code: varchar("code", { length: 50 }).notNull(),
    productId: uuid("product_id").references(() => products.id), // null = all products
    discountType: discountType("discount_type").notNull().default("PERCENTAGE"),
    discountValue: bigint("discount_value", { mode: "bigint" }).notNull(), // % (e.g. 20) or minor amount (e.g. 50000)
    maxRedemptions: integer("max_redemptions").notNull(),
    redemptionsCount: integer("redemptions_count").notNull().default(0),
    startAt: timestamp("start_at"),
    endAt: timestamp("end_at"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("coupons_seller_code_idx").on(t.sellerId, t.code)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    buyerId: uuid("buyer_id").references(() => users.id),
    buyerName: varchar("buyer_name", { length: 100 }).notNull(),
    buyerEmail: varchar("buyer_email", { length: 255 }).notNull(),
    buyerPhone: varchar("buyer_phone", { length: 50 }),
    buyerAddress: varchar("buyer_address", { length: 1000 }),
    quantity: integer("quantity").notNull().default(1),
    subtotalMinor: bigint("subtotal_minor", { mode: "bigint" }).notNull(),
    discountMinor: bigint("discount_minor", { mode: "bigint" }).notNull(),
    totalMinor: bigint("total_minor", { mode: "bigint" }).notNull(),
    platformFeeMinor: bigint("platform_fee_minor", { mode: "bigint" }).notNull(),
    sellerNetMinor: bigint("seller_net_minor", { mode: "bigint" }).notNull(),
    couponId: uuid("coupon_id").references(() => coupons.id),
    status: orderStatus("status").notNull().default("PENDING"),
    paystackReference: varchar("paystack_reference", { length: 150 }).notNull().unique(),
    paystackChannel: paymentChannel("paystack_channel"),
    trafficSource: varchar("traffic_source", { length: 100 }).default("direct"), // whatsapp, instagram, gbp, direct
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_seller_status_idx").on(t.sellerId, t.status),
    index("orders_paystack_ref_idx").on(t.paystackReference),
  ],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id),
    productId: uuid("product_id").references(() => products.id),
    eventType: varchar("event_type", { length: 50 }).notNull(), // catalogue_view, product_view, checkout_start, purchase
    trafficSource: varchar("traffic_source", { length: 100 }).default("direct"), // whatsapp, instagram, gbp, direct
    referrer: varchar("referrer", { length: 1000 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_seller_event_created_idx").on(t.sellerId, t.eventType, t.createdAt)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: accountStatus("status").notNull().default("ACTIVE"),
    currency: currency("currency").notNull().default("NGN"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wallets_user_status_idx").on(t.userId, t.status),
    index("wallets_user_status_currency_idx").on(t.userId, t.status, t.currency),
  ],
);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromWalletId: uuid("from_wallet_id")
    .notNull()
    .references(() => wallets.id),
  toWalletId: uuid("to_wallet_id")
    .notNull()
    .references(() => wallets.id),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  status: txStatus("status").notNull().default("PENDING"),
  idempotencyKey: varchar("idempotency_key", { length: 100 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id),
    type: ledgerType("type").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ledger_entries_wallet_type_amount_idx").on(
      t.walletId,
      t.type,
      t.amountMinor,
    ),
  ],
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
