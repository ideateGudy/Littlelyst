import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { eq, and, desc, sql } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import {
  promotions,
  coupons,
  products,
  Promotion,
  Coupon,
} from "../db/schema.js";

export interface CreatePromotionDto {
  productId: string;
  discountedPriceMinor: number | string | bigint;
  startAt: string;
  endAt: string;
}

export interface CreateCouponDto {
  code: string;
  productId?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "OVERRIDE_PRICE";
  discountValue: number | string | bigint;
  maxRedemptions: number;
  startAt?: string;
  endAt?: string;
}

@Injectable()
export class PromotionsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  // --- Flash Promotions ---
  async createPromotion(sellerId: string, dto: CreatePromotionDto) {
    // Validate product belongs to seller
    const prod = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, dto.productId), eq(products.sellerId, sellerId)))
      .limit(1);

    if (!prod[0]) {
      throw new NotFoundException({
        status: "failed",
        message: "Product not found",
      });
    }

    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) {
      throw new BadRequestException({
        status: "failed",
        message: "End time must be strictly after start time",
      });
    }

    const inserted = await this.db
      .insert(promotions)
      .values({
        productId: dto.productId,
        discountedPriceMinor: BigInt(dto.discountedPriceMinor),
        startAt: start,
        endAt: end,
        isActive: true,
      })
      .returning();

    return {
      ...inserted[0],
      discountedPriceMinor: inserted[0].discountedPriceMinor.toString(),
    };
  }

  async listSellerPromotions(sellerId: string) {
    const list = await this.db
      .select({
        id: promotions.id,
        productId: promotions.productId,
        productTitle: products.title,
        discountedPriceMinor: promotions.discountedPriceMinor,
        originalPriceMinor: products.priceMinor,
        startAt: promotions.startAt,
        endAt: promotions.endAt,
        isActive: promotions.isActive,
      })
      .from(promotions)
      .innerJoin(products, eq(promotions.productId, products.id))
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(promotions.createdAt));

    return list.map((p) => ({
      ...p,
      discountedPriceMinor: p.discountedPriceMinor.toString(),
      originalPriceMinor: p.originalPriceMinor.toString(),
    }));
  }

  async endPromotion(sellerId: string, promoId: string) {
    const promo = await this.db
      .select({
        id: promotions.id,
        sellerId: products.sellerId,
      })
      .from(promotions)
      .innerJoin(products, eq(promotions.productId, products.id))
      .where(and(eq(promotions.id, promoId), eq(products.sellerId, sellerId)))
      .limit(1);

    if (!promo[0]) {
      throw new NotFoundException({
        status: "failed",
        message: "Promotion not found",
      });
    }

    await this.db
      .update(promotions)
      .set({ isActive: false })
      .where(eq(promotions.id, promoId));
  }

  // --- Coupon Codes ---
  async createCoupon(sellerId: string, dto: CreateCouponDto) {
    const cleanCode = dto.code.trim().toUpperCase();

    const existing = await this.db
      .select()
      .from(coupons)
      .where(and(eq(coupons.sellerId, sellerId), eq(coupons.code, cleanCode)))
      .limit(1);

    if (existing[0]) {
      throw new BadRequestException({
        status: "failed",
        message: `Coupon code '${cleanCode}' already exists for your store`,
      });
    }

    const inserted = await this.db
      .insert(coupons)
      .values({
        sellerId,
        code: cleanCode,
        productId: dto.productId || null,
        discountType: dto.discountType ?? "PERCENTAGE",
        discountValue: BigInt(dto.discountValue),
        maxRedemptions: dto.maxRedemptions,
        redemptionsCount: 0,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        isActive: true,
      })
      .returning();

    return {
      ...inserted[0],
      discountValue: inserted[0].discountValue.toString(),
    };
  }

  async listSellerCoupons(sellerId: string) {
    const list = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.sellerId, sellerId))
      .orderBy(desc(coupons.createdAt));

    return list.map((c) => ({
      ...c,
      discountValue: c.discountValue.toString(),
    }));
  }

  /**
   * Validates coupon eligibility and calculates discount safely server-side
   */
  async validateAndApplyCoupon(
    sellerId: string,
    code: string,
    productId: string,
    basePriceMinor: bigint,
  ): Promise<{ coupon: Coupon; finalPriceMinor: bigint; discountMinor: bigint }> {
    const cleanCode = code.trim().toUpperCase();
    const list = await this.db
      .select()
      .from(coupons)
      .where(and(eq(coupons.sellerId, sellerId), eq(coupons.code, cleanCode)))
      .limit(1);

    const coupon = list[0];
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException({
        status: "failed",
        message: "Invalid or inactive coupon code",
      });
    }

    // Check product applicability
    if (coupon.productId && coupon.productId !== productId) {
      throw new BadRequestException({
        status: "failed",
        message: "Coupon is not applicable to this product",
      });
    }

    // Check date range
    const now = new Date();
    if (coupon.startAt && now < new Date(coupon.startAt)) {
      throw new BadRequestException({
        status: "failed",
        message: "Coupon has not started yet",
      });
    }
    if (coupon.endAt && now > new Date(coupon.endAt)) {
      throw new BadRequestException({
        status: "failed",
        message: "Coupon has expired",
      });
    }

    // Check redemption cap
    if (coupon.redemptionsCount >= coupon.maxRedemptions) {
      throw new BadRequestException({
        status: "failed",
        message: "This coupon code has reached its redemption limit",
      });
    }

    let discountMinor = 0n;
    if (coupon.discountType === "PERCENTAGE") {
      const pct = BigInt(coupon.discountValue);
      discountMinor = (basePriceMinor * pct) / 100n;
    } else if (coupon.discountType === "FIXED_AMOUNT") {
      discountMinor = BigInt(coupon.discountValue);
    } else if (coupon.discountType === "OVERRIDE_PRICE") {
      const overridePrice = BigInt(coupon.discountValue);
      discountMinor = basePriceMinor > overridePrice ? basePriceMinor - overridePrice : 0n;
    }

    if (discountMinor > basePriceMinor) {
      discountMinor = basePriceMinor;
    }

    const finalPriceMinor = basePriceMinor - discountMinor;

    return {
      coupon,
      finalPriceMinor,
      discountMinor,
    };
  }

  /**
   * Atomic increment of redemption count (concurrency-safe)
   */
  async incrementRedemption(couponId: string) {
    await this.db
      .update(coupons)
      .set({
        redemptionsCount: sql`${coupons.redemptionsCount} + 1`,
      })
      .where(
        and(
          eq(coupons.id, couponId),
          sql`${coupons.redemptionsCount} < ${coupons.maxRedemptions}`,
        ),
      );
  }
}
