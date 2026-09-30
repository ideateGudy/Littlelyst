import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { eq, and, or, desc } from "drizzle-orm";
import crypto from "crypto";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import {
  orders,
  products,
  productVariants,
  promotions,
  coupons,
  users,
  Order,
  NewOrder,
} from "../db/schema.js";
import { PromotionsService } from "../promotions/promotions.service.js";
import { EmailService } from "../email/email.service.js";

export interface GuestCheckoutDto {
  sellerId: string;
  productId: string;
  variantId?: string;
  quantity?: number;
  buyerId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerAddress?: string;
  couponCode?: string;
  trafficSource?: string;
  paymentMethod?: "PAYSTACK" | "PAY_ON_DELIVERY";
}

/** Helper: convert all BigInt fields in an order row to strings */
function serializeOrder(o: any) {
  return {
    ...o,
    totalMinor: o.totalMinor?.toString() ?? "0",
    subtotalMinor: o.subtotalMinor?.toString() ?? "0",
    discountMinor: o.discountMinor?.toString() ?? "0",
    sellerNetMinor: o.sellerNetMinor?.toString() ?? "0",
    platformFeeMinor: o.platformFeeMinor?.toString() ?? "0",
  };
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly promotionsService: PromotionsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Initializes guest checkout, validates product & stock, applies server-side promo/coupon,
   * calculates platform commission, and generates Paystack checkout payload.
   */
  async initializeGuestOrder(dto: GuestCheckoutDto) {
    const prodList = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, dto.productId), eq(products.sellerId, dto.sellerId)))
      .limit(1);

    const product = prodList[0];
    if (!product || product.visibility === "DRAFT") {
      throw new NotFoundException({
        status: "failed",
        message: "Product is not available for purchase",
      });
    }

    const qty = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;

    // Determine base unit price according to hierarchy:
    // Original Price > Discount Price (if available) > Promo Price (if promo active & quota available)
    let unitPrice = product.priceMinor;
    if (product.discountPriceMinor && product.discountPriceMinor < unitPrice) {
      unitPrice = product.discountPriceMinor;
    }

    if (dto.variantId) {
      const varList = await this.db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, dto.variantId),
            eq(productVariants.productId, product.id),
          ),
        )
        .limit(1);

      const variant = varList[0];
      if (!variant) {
        throw new BadRequestException({
          status: "failed",
          message: "Selected variant does not exist",
        });
      }

      if (variant.stockQuantity < qty) {
        throw new BadRequestException({
          status: "failed",
          message: "Variant is out of stock",
        });
      }

      unitPrice = unitPrice + variant.priceDeltaMinor;
    } else {
      if (product.productType === "PHYSICAL" && product.stockQuantity < qty) {
        throw new BadRequestException({
          status: "failed",
          message: "Product is currently out of stock",
        });
      }
    }

    // Check server-side promo pricing (authoritative priority over discount & original price)
    const now = new Date();
    const activePromo = await this.db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.productId, product.id),
          eq(promotions.isActive, true),
        ),
      )
      .limit(1);

    if (activePromo[0]) {
      const isWithinDates =
        now >= new Date(activePromo[0].startAt) &&
        now <= new Date(activePromo[0].endAt);
      const hasAvailableQuota =
        activePromo[0].maxItems === null ||
        activePromo[0].maxItems === undefined ||
        activePromo[0].itemsSold < activePromo[0].maxItems;

      if (isWithinDates && hasAvailableQuota) {
        let promoPrice = activePromo[0].discountedPriceMinor;
        if (dto.variantId) {
          // Add variant delta if variant selected
          const v = await this.db
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, dto.variantId))
            .limit(1);
          if (v[0]) {
            promoPrice = promoPrice + v[0].priceDeltaMinor;
          }
        }
        unitPrice = promoPrice;

        // Increment promo itemsSold count
        await this.db
          .update(promotions)
          .set({ itemsSold: activePromo[0].itemsSold + qty })
          .where(eq(promotions.id, activePromo[0].id));
      }
    }

    const subtotalMinor = unitPrice * BigInt(qty);
    let totalMinor = subtotalMinor;
    let discountMinor = 0n;
    let couponId: string | null = null;

    // Apply Coupon if provided
    if (dto.couponCode) {
      const couponResult = await this.promotionsService.validateAndApplyCoupon(
        dto.sellerId,
        dto.couponCode,
        dto.productId,
        subtotalMinor,
      );
      totalMinor = couponResult.finalPriceMinor;
      discountMinor = couponResult.discountMinor;
      couponId = couponResult.coupon.id;
    }

    // Platform Commission (default 5%)
    const sellerList = await this.db
      .select({
        id: users.id,
        commissionPercent: users.commissionPercent,
        paystackSubaccountCode: users.paystackSubaccountCode,
      })
      .from(users)
      .where(eq(users.id, dto.sellerId))
      .limit(1);

    const commissionPercent = BigInt(sellerList[0]?.commissionPercent ?? 5);
    const platformFeeMinor = (totalMinor * commissionPercent) / 100n;
    const sellerNetMinor = totalMinor - platformFeeMinor;

    const paystackReference = `lyst_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // For pay-on-delivery: set status to PENDING, no paystack needed
    const initialStatus = dto.paymentMethod === "PAY_ON_DELIVERY" ? "PENDING" : "PENDING";

    const newOrder: NewOrder = {
      sellerId: dto.sellerId,
      productId: dto.productId,
      variantId: dto.variantId ?? null,
      buyerId: dto.buyerId ?? null,
      buyerName: dto.buyerName.trim(),
      buyerEmail: dto.buyerEmail.toLowerCase().trim(),
      buyerPhone: dto.buyerPhone?.trim() ?? null,
      buyerAddress: dto.buyerAddress?.trim() ?? null,
      quantity: qty,
      subtotalMinor,
      discountMinor,
      totalMinor,
      platformFeeMinor,
      sellerNetMinor,
      couponId,
      status: initialStatus,
      paymentMethod: dto.paymentMethod ?? "PAYSTACK",
      paystackReference,
      trafficSource: dto.trafficSource || "direct",
    };

    const inserted = await this.db.insert(orders).values(newOrder).returning();
    const order = inserted[0];

    return {
      orderId: order.id,
      paystackReference,
      paymentMethod: dto.paymentMethod ?? "PAYSTACK",
      totalMinor: totalMinor.toString(),
      subtotalMinor: subtotalMinor.toString(),
      discountMinor: discountMinor.toString(),
      buyerEmail: order.buyerEmail,
      subaccount: sellerList[0]?.paystackSubaccountCode ?? null,
      platformFeeMinor: platformFeeMinor.toString(),
      currency: "NGN",
    };
  }

  async getOrderDetails(paystackReference: string) {
    const list = await this.db
      .select({
        id: orders.id,
        status: orders.status,
        totalMinor: orders.totalMinor,
        quantity: orders.quantity,
        buyerName: orders.buyerName,
        buyerEmail: orders.buyerEmail,
        paidAt: orders.paidAt,
        paystackReference: orders.paystackReference,
        productTitle: products.title,
        productType: products.productType,
        digitalFileUrl: products.digitalFileUrl,
        digitalKeyOrNote: products.digitalKeyOrNote,
        sellerName: users.name,
        sellerHandle: users.handle,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.sellerId, users.id))
      .where(eq(orders.paystackReference, paystackReference))
      .limit(1);

    const order = list[0];
    if (!order) {
      throw new NotFoundException({
        status: "failed",
        message: "Order not found",
      });
    }

    return {
      ...order,
      totalMinor: order.totalMinor.toString(),
      // Hide digital download unless order is paid
      digitalFileUrl: order.status === "PAID" ? order.digitalFileUrl : null,
      digitalKeyOrNote: order.status === "PAID" ? order.digitalKeyOrNote : null,
    };
  }

  async listSellerOrders(sellerId: string) {
    const list = await this.db
      .select({
        id: orders.id,
        buyerName: orders.buyerName,
        buyerEmail: orders.buyerEmail,
        buyerPhone: orders.buyerPhone,
        productTitle: products.title,
        productType: products.productType,
        quantity: orders.quantity,
        totalMinor: orders.totalMinor,
        sellerNetMinor: orders.sellerNetMinor,
        platformFeeMinor: orders.platformFeeMinor,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        trafficSource: orders.trafficSource,
        paystackReference: orders.paystackReference,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.sellerId, sellerId))
      .orderBy(desc(orders.createdAt));

    return list.map(serializeOrder);
  }

  async listBuyerOrders(buyerId: string, buyerEmail?: string) {
    const condition = buyerEmail
      ? or(eq(orders.buyerId, buyerId), eq(orders.buyerEmail, buyerEmail.toLowerCase().trim()))
      : eq(orders.buyerId, buyerId);

    const list = await this.db
      .select({
        id: orders.id,
        buyerName: orders.buyerName,
        buyerEmail: orders.buyerEmail,
        buyerPhone: orders.buyerPhone,
        buyerAddress: orders.buyerAddress,
        productTitle: products.title,
        productType: products.productType,
        images: products.images,
        digitalFileUrl: products.digitalFileUrl,
        digitalKeyOrNote: products.digitalKeyOrNote,
        sellerName: users.name,
        sellerHandle: users.handle,
        quantity: orders.quantity,
        totalMinor: orders.totalMinor,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paystackReference: orders.paystackReference,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.sellerId, users.id))
      .where(condition)
      .orderBy(desc(orders.createdAt));

    return list.map((o) => ({
      ...serializeOrder(o),
      digitalFileUrl: o.status === "PAID" ? o.digitalFileUrl : null,
      digitalKeyOrNote: o.status === "PAID" ? o.digitalKeyOrNote : null,
    }));
  }

  async updateOrderStatus(
    orderId: string,
    sellerId: string,
    newStatus: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "FAILED",
  ) {
    const existing = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.sellerId, sellerId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        status: "failed",
        message: "Order not found or unauthorized",
      });
    }

    const updated = await this.db
      .update(orders)
      .set({
        status: newStatus,
        ...(newStatus === "PAID" && !existing[0].paidAt ? { paidAt: new Date() } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return serializeOrder(updated[0]);
  }

  async sendPaymentReminder(orderId: string, sellerId: string) {
    const list = await this.db
      .select({
        id: orders.id,
        buyerName: orders.buyerName,
        buyerEmail: orders.buyerEmail,
        paystackReference: orders.paystackReference,
        status: orders.status,
        productTitle: products.title,
        sellerHandle: users.handle,
        sellerReminderTemplate: users.reminderEmailTemplate,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.sellerId, users.id))
      .where(and(eq(orders.id, orderId), eq(orders.sellerId, sellerId)))
      .limit(1);

    const order = list[0];
    if (!order) {
      throw new NotFoundException({
        status: "failed",
        message: "Order not found or unauthorized",
      });
    }

    const baseUrl = process.env.CLIENT_URL || "https://littlelyst.com";
    const paymentLink = `${baseUrl}/${order.sellerHandle}`;

    await this.emailService.sendOrderReminderEmail(
      order.buyerEmail,
      order.buyerName,
      order.productTitle,
      paymentLink,
      order.sellerReminderTemplate,
    );

    return { sent: true, to: order.buyerEmail };
  }
}
