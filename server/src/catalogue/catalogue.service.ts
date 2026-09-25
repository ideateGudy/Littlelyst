import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import {
  users,
  products,
  productVariants,
  promotions,
  analyticsEvents,
} from "../db/schema.js";

@Injectable()
export class CatalogueService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async getSellerCatalogue(
    handle: string,
    tracking?: { trafficSource?: string; referrer?: string },
  ) {
    const cleanHandle = handle.toLowerCase().trim();
    const sellerList = await this.db
      .select({
        id: users.id,
        name: users.name,
        handle: users.handle,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        role: users.role,
      })
      .from(users)
      .where(eq(users.handle, cleanHandle))
      .limit(1);

    const seller = sellerList[0];
    if (!seller || seller.role === "buyer") {
      throw new NotFoundException({
        status: "failed",
        message: `Catalogue @${handle} not found`,
      });
    }

    // Public products only
    const publicProducts = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.sellerId, seller.id),
          eq(products.visibility, "PUBLIC"),
        ),
      )
      .orderBy(desc(products.createdAt));

    // Gather promo and variants for each product
    const items = [];
    const now = new Date();

    for (const prod of publicProducts) {
      const variants = await this.db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, prod.id));

      const activePromo = await this.db
        .select()
        .from(promotions)
        .where(
          and(
            eq(promotions.productId, prod.id),
            eq(promotions.isActive, true),
          ),
        )
        .limit(1);

      // Verify server-side promo expiry and item limits
      let validPromo = null;
      if (activePromo[0]) {
        const isWithinDates =
          now >= new Date(activePromo[0].startAt) &&
          now <= new Date(activePromo[0].endAt);
        const hasAvailablePromoQuota =
          activePromo[0].maxItems === null ||
          activePromo[0].maxItems === undefined ||
          activePromo[0].itemsSold < activePromo[0].maxItems;

        if (isWithinDates && hasAvailablePromoQuota) {
          validPromo = {
            ...activePromo[0],
            discountedPriceMinor: activePromo[0].discountedPriceMinor.toString(),
            maxItems: activePromo[0].maxItems,
            itemsSold: activePromo[0].itemsSold,
          };
        }
      }

      items.push({
        ...prod,
        priceMinor: prod.priceMinor.toString(),
        discountPriceMinor: prod.discountPriceMinor ? prod.discountPriceMinor.toString() : null,
        variants: variants.map((v) => ({
          ...v,
          priceDeltaMinor: v.priceDeltaMinor.toString(),
        })),
        activePromotion: validPromo,
      });
    }

    // Record catalogue_view analytics asynchronously
    if (tracking?.trafficSource || tracking?.referrer) {
      this.db
        .insert(analyticsEvents)
        .values({
          sellerId: seller.id,
          eventType: "catalogue_view",
          trafficSource: tracking.trafficSource || "direct",
          referrer: tracking.referrer || null,
        })
        .catch(() => {});
    }

    return {
      seller,
      products: items,
    };
  }

  async getPublicProduct(
    handle: string,
    slug: string,
    tracking?: { trafficSource?: string; referrer?: string },
  ) {
    const cleanHandle = handle.toLowerCase().trim();
    const sellerList = await this.db
      .select({
        id: users.id,
        name: users.name,
        handle: users.handle,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.handle, cleanHandle))
      .limit(1);

    const seller = sellerList[0];
    if (!seller || seller.role === "buyer") {
      throw new NotFoundException({
        status: "failed",
        message: `Catalogue @${handle} not found`,
      });
    }

    const prodList = await this.db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, seller.id), eq(products.slug, slug)))
      .limit(1);

    const product = prodList[0];
    if (!product || product.visibility === "DRAFT") {
      throw new NotFoundException({
        status: "failed",
        message: "Product not found or unavailable",
      });
    }

    const variants = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));

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

    const now = new Date();
    let validPromo = null;
    if (activePromo[0]) {
      const isWithinDates =
        now >= new Date(activePromo[0].startAt) &&
        now <= new Date(activePromo[0].endAt);
      const hasAvailablePromoQuota =
        activePromo[0].maxItems === null ||
        activePromo[0].maxItems === undefined ||
        activePromo[0].itemsSold < activePromo[0].maxItems;

      if (isWithinDates && hasAvailablePromoQuota) {
        validPromo = {
          ...activePromo[0],
          discountedPriceMinor: activePromo[0].discountedPriceMinor.toString(),
          maxItems: activePromo[0].maxItems,
          itemsSold: activePromo[0].itemsSold,
        };
      }
    }

    // Record product_view event
    if (tracking?.trafficSource || tracking?.referrer) {
      this.db
        .insert(analyticsEvents)
        .values({
          sellerId: seller.id,
          productId: product.id,
          eventType: "product_view",
          trafficSource: tracking.trafficSource || "direct",
          referrer: tracking.referrer || null,
        })
        .catch(() => {});
    }

    return {
      seller,
      product: {
        ...product,
        priceMinor: product.priceMinor.toString(),
        discountPriceMinor: product.discountPriceMinor ? product.discountPriceMinor.toString() : null,
        variants: variants.map((v) => ({
          ...v,
          priceDeltaMinor: v.priceDeltaMinor.toString(),
        })),
        activePromotion: validPromo,
      },
    };
  }
}
