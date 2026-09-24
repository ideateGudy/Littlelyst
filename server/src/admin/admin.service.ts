import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { eq, sql, desc, count } from "drizzle-orm";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import { users, products, orders, wallets } from "../db/schema.js";
import { UsersService } from "../users/users.service.js";

export interface CreateAdminUserDto {
  name: string;
  email: string;
  password: string;
  role?: "seller" | "admin" | "super-admin";
  handle?: string;
  phone?: string;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly usersService: UsersService,
  ) {}

  async listAllUsers() {
    // 1. Fetch all users
    const allUsers = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        handle: users.handle,
        role: users.role,
        systemUser: users.systemUser,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        paystackBankName: users.paystackBankName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // 2. Fetch product counts per user
    const productCounts = await this.db
      .select({
        sellerId: products.sellerId,
        count: count(products.id),
      })
      .from(products)
      .groupBy(products.sellerId);

    const productCountMap = new Map<string, number>();
    productCounts.forEach((pc) => {
      productCountMap.set(pc.sellerId, Number(pc.count));
    });

    // 3. Fetch order stats (count, volume, seller earnings, platform fees) per user
    const orderAggregates = await this.db
      .select({
        sellerId: orders.sellerId,
        orderCount: count(orders.id),
        totalVolumeMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.totalMinor} else 0 end), 0)::text`,
        sellerEarnedMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.sellerNetMinor} else 0 end), 0)::text`,
        platformFeeMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.platformFeeMinor} else 0 end), 0)::text`,
      })
      .from(orders)
      .groupBy(orders.sellerId);

    const orderStatsMap = new Map<
      string,
      { orderCount: number; totalVolumeMinor: string; sellerEarnedMinor: string; platformFeeMinor: string }
    >();
    orderAggregates.forEach((oa) => {
      orderStatsMap.set(oa.sellerId, {
        orderCount: Number(oa.orderCount),
        totalVolumeMinor: oa.totalVolumeMinor || "0",
        sellerEarnedMinor: oa.sellerEarnedMinor || "0",
        platformFeeMinor: oa.platformFeeMinor || "0",
      });
    });

    return allUsers.map((u) => {
      const stats = orderStatsMap.get(u.id) || {
        orderCount: 0,
        totalVolumeMinor: "0",
        sellerEarnedMinor: "0",
        platformFeeMinor: "0",
      };
      return {
        ...u,
        productCount: productCountMap.get(u.id) || 0,
        orderCount: stats.orderCount,
        totalVolumeMinor: stats.totalVolumeMinor,
        sellerEarnedMinor: stats.sellerEarnedMinor,
        platformFeeMinor: stats.platformFeeMinor,
      };
    });
  }

  async getPlatformFinancialOverview() {
    // Calculate platform-wide totals across all completed/paid/fulfilled orders
    const stats = await this.db
      .select({
        totalVolumeMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.totalMinor} else 0 end), 0)::text`,
        platformEarnedMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.platformFeeMinor} else 0 end), 0)::text`,
        storesPaidMinor: sql<string>`coalesce(sum(case when ${orders.status} in ('PAID', 'FULFILLED') then ${orders.sellerNetMinor} else 0 end), 0)::text`,
        totalPaidOrders: sql<string>`coalesce(count(case when ${orders.status} in ('PAID', 'FULFILLED') then 1 else null end), 0)::text`,
        totalAllOrders: sql<string>`count(${orders.id})::text`,
      })
      .from(orders);

    const storeCount = await this.db
      .select({ count: count(users.id) })
      .from(users);

    const row = stats[0] || {
      totalVolumeMinor: "0",
      platformEarnedMinor: "0",
      storesPaidMinor: "0",
      totalPaidOrders: "0",
      totalAllOrders: "0",
    };

    return {
      totalVolumeMinor: row.totalVolumeMinor,
      platformEarnedMinor: row.platformEarnedMinor,
      storesPaidMinor: row.storesPaidMinor,
      totalPaidOrders: Number(row.totalPaidOrders),
      totalAllOrders: Number(row.totalAllOrders),
      totalStores: Number(storeCount[0]?.count || 0),
    };
  }

  async createUser(dto: CreateAdminUserDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException("A user with this email already exists");
    }

    const assignedRole = dto.role || "seller";
    const isSuper = assignedRole === "super-admin";

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      handle: dto.handle,
      phone: dto.phone,
      role: assignedRole,
      systemUser: isSuper,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      role: (user as any).role || assignedRole,
      systemUser: user.systemUser,
      createdAt: user.createdAt,
    };
  }

  async updateUserRole(targetUserId: string, newRole: "seller" | "admin" | "super-admin") {
    const validRoles = ["seller", "admin", "super-admin"];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Role must be one of: ${validRoles.join(", ")}`);
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    const isSuper = newRole === "super-admin";

    const updated = await this.db
      .update(users)
      .set({
        role: newRole,
        systemUser: isSuper,
      })
      .where(eq(users.id, targetUserId))
      .returning();

    return {
      id: updated[0].id,
      name: updated[0].name,
      email: updated[0].email,
      role: (updated[0] as any).role,
      systemUser: updated[0].systemUser,
    };
  }

  async deleteUser(targetUserId: string, currentAdminId: string) {
    if (targetUserId === currentAdminId) {
      throw new BadRequestException("You cannot delete your own super admin account");
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    // Unlink products & wallets or delete safely
    await this.db.delete(users).where(eq(users.id, targetUserId));
    return { status: "success", message: "User deleted successfully" };
  }
}
