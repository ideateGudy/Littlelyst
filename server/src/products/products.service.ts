import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import {
  products,
  productVariants,
  promotions,
  analyticsEvents,
  coupons,
  orders,
  Product,
  NewProduct,
  ProductVariant,
} from "../db/schema.js";

export interface CreateProductDto {
  title: string;
  description?: string;
  priceMinor: number | string | bigint;
  discountPriceMinor?: number | string | bigint | null;
  productType?: "PHYSICAL" | "DIGITAL";
  visibility?: "PUBLIC" | "UNLISTED" | "DRAFT";
  images?: string[];
  stockQuantity?: number;
  digitalFileUrl?: string;
  digitalKeyOrNote?: string;
  variants?: Array<{
    title: string;
    priceDeltaMinor?: number | string | bigint;
    stockQuantity?: number;
    sku?: string;
  }>;
  promotion?: {
    discountedPriceMinor: number | string | bigint;
    startAt?: string | Date;
    endAt?: string | Date;
    maxItems?: number | null;
  };
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  private slugify(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "item"
    );
  }

  async listSellerProducts(sellerId: string): Promise<any[]> {
    const sellerProducts = await this.db
      .select()
      .from(products)
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(products.createdAt));

    const result = [];
    for (const prod of sellerProducts) {
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

      result.push({
        ...prod,
        priceMinor: prod.priceMinor.toString(),
        discountPriceMinor: prod.discountPriceMinor ? prod.discountPriceMinor.toString() : null,
        variants: variants.map((v) => ({
          ...v,
          priceDeltaMinor: v.priceDeltaMinor.toString(),
        })),
        activePromotion: activePromo[0]
          ? {
              ...activePromo[0],
              discountedPriceMinor: activePromo[0].discountedPriceMinor.toString(),
            }
          : null,
      });
    }

    return result;
  }

  async getSellerProductById(sellerId: string, id: string): Promise<any> {
    const list = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerId)))
      .limit(1);

    const product = list[0];
    if (!product) {
      throw new NotFoundException({
        status: "failed",
        message: "Product not found",
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

    return {
      ...product,
      priceMinor: product.priceMinor.toString(),
      discountPriceMinor: product.discountPriceMinor ? product.discountPriceMinor.toString() : null,
      variants: variants.map((v) => ({
        ...v,
        priceDeltaMinor: v.priceDeltaMinor.toString(),
      })),
      activePromotion: activePromo[0]
        ? {
            ...activePromo[0],
            discountedPriceMinor: activePromo[0].discountedPriceMinor.toString(),
          }
        : null,
    };
  }

  async createProduct(sellerId: string, dto: CreateProductDto): Promise<any> {
    const baseSlug = this.slugify(dto.title);
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProd: NewProduct = {
      sellerId,
      title: dto.title.trim(),
      slug,
      description: dto.description?.trim() ?? null,
      priceMinor: BigInt(dto.priceMinor),
      discountPriceMinor: dto.discountPriceMinor ? BigInt(dto.discountPriceMinor) : null,
      productType: dto.productType ?? "PHYSICAL",
      visibility: dto.visibility ?? "PUBLIC",
      images: dto.images ?? [],
      stockQuantity: dto.stockQuantity ?? 10,
      digitalFileUrl: dto.digitalFileUrl ?? null,
      digitalKeyOrNote: dto.digitalKeyOrNote ?? null,
      hasVariants: Boolean(dto.variants && dto.variants.length > 0),
    };

    const inserted = await this.db.insert(products).values(newProd).returning();
    const product = inserted[0];

    let insertedVariants: ProductVariant[] = [];
    if (dto.variants && dto.variants.length > 0) {
      const variantInserts = dto.variants.map((v) => ({
        productId: product.id,
        title: v.title.trim(),
        priceDeltaMinor: BigInt(v.priceDeltaMinor ?? 0),
        stockQuantity: v.stockQuantity ?? 0,
        sku: v.sku?.trim() ?? null,
      }));
      insertedVariants = await this.db
        .insert(productVariants)
        .values(variantInserts)
        .returning();
    }

    let insertedPromo = null;
    if (dto.promotion && dto.promotion.discountedPriceMinor) {
      const startAt = dto.promotion.startAt ? new Date(dto.promotion.startAt) : new Date();
      const endAt = dto.promotion.endAt
        ? new Date(dto.promotion.endAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const promoInserts = await this.db
        .insert(promotions)
        .values({
          productId: product.id,
          discountedPriceMinor: BigInt(dto.promotion.discountedPriceMinor),
          startAt,
          endAt,
          maxItems: dto.promotion.maxItems ?? null,
          itemsSold: 0,
          isActive: true,
        })
        .returning();

      if (promoInserts[0]) {
        insertedPromo = {
          ...promoInserts[0],
          discountedPriceMinor: promoInserts[0].discountedPriceMinor.toString(),
        };
      }
    }

    return {
      ...product,
      priceMinor: product.priceMinor.toString(),
      discountPriceMinor: product.discountPriceMinor ? product.discountPriceMinor.toString() : null,
      variants: insertedVariants.map((v) => ({
        ...v,
        priceDeltaMinor: v.priceDeltaMinor.toString(),
      })),
      activePromotion: insertedPromo,
    };
  }

  async updateProduct(
    sellerId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<any> {
    const existing = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        status: "failed",
        message: "Product not found",
      });
    }

    const updates: Partial<NewProduct> = {};
    if (dto.title !== undefined) updates.title = dto.title.trim();
    if (dto.description !== undefined) updates.description = dto.description.trim();
    if (dto.priceMinor !== undefined) updates.priceMinor = BigInt(dto.priceMinor);
    if (dto.discountPriceMinor !== undefined)
      updates.discountPriceMinor = dto.discountPriceMinor ? BigInt(dto.discountPriceMinor) : null;
    if (dto.productType !== undefined) updates.productType = dto.productType;
    if (dto.visibility !== undefined) updates.visibility = dto.visibility;
    if (dto.images !== undefined) updates.images = dto.images;
    if (dto.stockQuantity !== undefined) updates.stockQuantity = dto.stockQuantity;
    if (dto.digitalFileUrl !== undefined) updates.digitalFileUrl = dto.digitalFileUrl;
    if (dto.digitalKeyOrNote !== undefined) updates.digitalKeyOrNote = dto.digitalKeyOrNote;

    const updated = await this.db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    return {
      ...updated[0],
      priceMinor: updated[0].priceMinor.toString(),
      discountPriceMinor: updated[0].discountPriceMinor ? updated[0].discountPriceMinor.toString() : null,
    };
  }

  async deleteProduct(sellerId: string, id: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        status: "failed",
        message: "Product not found",
      });
    }

    // Check if product has historical orders
    const existingOrders = await this.db
      .select()
      .from(orders)
      .where(eq(orders.productId, id))
      .limit(1);

    if (existingOrders.length > 0) {
      // Soft-delete to preserve order accounting records
      await this.db
        .update(products)
        .set({ visibility: "DRAFT", stockQuantity: 0 })
        .where(eq(products.id, id));

      await this.db
        .update(promotions)
        .set({ isActive: false })
        .where(eq(promotions.productId, id));

      return;
    }

    // Clean up child table records
    await this.db.delete(promotions).where(eq(promotions.productId, id));
    await this.db.delete(productVariants).where(eq(productVariants.productId, id));
    await this.db.delete(analyticsEvents).where(eq(analyticsEvents.productId, id));
    await this.db.update(coupons).set({ productId: null }).where(eq(coupons.productId, id));

    // Hard-delete product
    await this.db.delete(products).where(eq(products.id, id));
  }
}
