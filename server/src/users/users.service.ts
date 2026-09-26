import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DRIZZLE } from "../db/index.js";
import type { DrizzleDb } from "../db/index.js";
import { users, User, NewUser } from "../db/schema.js";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
    return results[0];
  }

  async findByHandle(handle: string): Promise<User | undefined> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.handle, handle.toLowerCase().trim()))
      .limit(1);
    return results[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return results[0];
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    handle?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    role?: "seller" | "admin" | "super-admin" | "buyer";
    systemUser?: boolean;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const assignedRole = data.role || "seller";
    // Generate fallback handle if not provided
    const defaultPrefix = assignedRole === "buyer" ? "buyer" : "seller";
    const baseHandle = (data.handle || data.name.toLowerCase().replace(/[^a-z0-9]/g, "")).slice(0, 30) || defaultPrefix;
    let finalHandle = baseHandle;
    const existing = await this.findByHandle(finalHandle);
    if (existing) {
      finalHandle = `${baseHandle}${Math.floor(100 + Math.random() * 900)}`;
    }

    const newUser: NewUser = {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      handle: finalHandle,
      phone: data.phone?.trim() ?? null,
      bio: data.bio?.trim() ?? null,
      avatarUrl: data.avatarUrl ?? null,
      passwordHash,
      role: assignedRole,
      systemUser: data.systemUser ?? (assignedRole === "super-admin"),
    };

    const results = await this.db.insert(users).values(newUser).returning();
    return results[0];
  }

  async generateUniqueHandle(brandOrName: string): Promise<string> {
    const clean = brandOrName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "store";

    let candidate = clean;
    let counter = 1;
    while (true) {
      const existing = await this.findByHandle(candidate);
      if (!existing) {
        return candidate;
      }
      candidate = `${clean}-${Math.floor(100 + Math.random() * 900)}`;
      counter++;
      if (counter > 10) {
        return `${clean}-${Date.now().toString().slice(-4)}`;
      }
    }
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      handle?: string;
      phone?: string;
      bio?: string;
      avatarUrl?: string;
      paystackBankName?: string;
      paystackAccountNumber?: string;
      role?: "seller" | "admin" | "super-admin" | "buyer";
    },
  ): Promise<User> {
    if (data.handle) {
      const cleanHandle = data.handle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-_]/g, "");
      const existing = await this.findByHandle(cleanHandle);
      if (existing && existing.id !== userId) {
        throw new Error("This handle is already taken by another store");
      }
      data.handle = cleanHandle;
    }

    const results = await this.db
      .update(users)
      .set({
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.handle ? { handle: data.handle } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.paystackBankName ? { paystackBankName: data.paystackBankName } : {}),
        ...(data.paystackAccountNumber ? { paystackAccountNumber: data.paystackAccountNumber } : {}),
        ...(data.role ? { role: data.role } : {}),
      })
      .where(eq(users.id, userId))
      .returning();

    return results[0];
  }

  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const results = await this.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
