import { Injectable, Inject } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import {
  orders,
  analyticsEvents,
  products,
} from "../db/schema.js";

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async getSellerDashboardStats(sellerId: string) {
    // 1. Total revenue & orders from paid orders
    const paidOrders = await this.db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.sellerNetMinor}), 0)::text`,
        totalOrders: sql<string>`COUNT(${orders.id})::text`,
      })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "PAID")));

    // 2. Total views (catalogue + product views)
    const views = await this.db
      .select({
        catalogueViews: sql<string>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'catalogue_view' THEN 1 END)::text`,
        productViews: sql<string>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'product_view' THEN 1 END)::text`,
        totalViews: sql<string>`COUNT(${analyticsEvents.id})::text`,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.sellerId, sellerId));

    // 3. Traffic breakdown (WhatsApp, Instagram, Google Business Profile, Direct)
    const trafficSources = await this.db
      .select({
        source: analyticsEvents.trafficSource,
        count: sql<number>`COUNT(${analyticsEvents.id})`,
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.sellerId, sellerId))
      .groupBy(analyticsEvents.trafficSource);

    // 4. Sales by source (e.g. gbp, whatsapp, instagram)
    const salesBySource = await this.db
      .select({
        source: orders.trafficSource,
        revenue: sql<string>`COALESCE(SUM(${orders.sellerNetMinor}), 0)::text`,
        orderCount: sql<number>`COUNT(${orders.id})`,
      })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "PAID")))
      .groupBy(orders.trafficSource);

    // 5. Recent sales list
    const recentSales = await this.db
      .select({
        id: orders.id,
        buyerName: orders.buyerName,
        productTitle: products.title,
        amountMinor: orders.sellerNetMinor,
        trafficSource: orders.trafficSource,
        paidAt: orders.paidAt,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(and(eq(orders.sellerId, sellerId), eq(orders.status, "PAID")))
      .orderBy(desc(orders.paidAt))
      .limit(5);

    // 6. 7-Day Performance Timeseries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await this.db
      .select({
        date: sql<string>`TO_CHAR(${orders.paidAt}, 'YYYY-MM-DD')`,
        dayName: sql<string>`TO_CHAR(${orders.paidAt}, 'Dy')`,
        revenue: sql<string>`COALESCE(SUM(${orders.sellerNetMinor}), 0)::text`,
        ordersCount: sql<number>`COUNT(${orders.id})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, sellerId),
          eq(orders.status, "PAID"),
          sql`${orders.paidAt} >= ${sevenDaysAgo.toISOString()}`
        )
      )
      .groupBy(sql`TO_CHAR(${orders.paidAt}, 'YYYY-MM-DD')`, sql`TO_CHAR(${orders.paidAt}, 'Dy')`)
      .orderBy(sql`TO_CHAR(${orders.paidAt}, 'YYYY-MM-DD')`);

    const totalViewsNum = Number(views[0]?.totalViews || 0);
    const totalOrdersNum = Number(paidOrders[0]?.totalOrders || 0);
    const conversionRate =
      totalViewsNum > 0
        ? ((totalOrdersNum / totalViewsNum) * 100).toFixed(1)
        : "0.0";

    return {
      totalRevenueMinor: paidOrders[0]?.totalRevenue || "0",
      totalOrders: totalOrdersNum,
      totalViews: totalViewsNum,
      conversionRate: `${conversionRate}%`,
      dailyTrends: dailyTrends.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        revenueMinor: d.revenue,
        orders: Number(d.ordersCount),
      })),
      trafficSources: trafficSources.map((t) => ({
        source: t.source || "direct",
        count: Number(t.count),
      })),
      salesBySource: salesBySource.map((s) => ({
        source: s.source || "direct",
        revenueMinor: s.revenue,
        orders: Number(s.orderCount),
      })),
      recentSales: recentSales.map((r) => ({
        ...r,
        amountMinor: r.amountMinor.toString(),
      })),
    };
  }
}
