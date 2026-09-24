"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Users,
  UserPlus,
  Store,
  RefreshCw,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  AlertTriangle,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Banknote,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: string;
  systemUser: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  paystackBankName?: string | null;
  createdAt: string;
  productCount: number;
  orderCount: number;
  totalVolumeMinor?: string;
  sellerEarnedMinor?: string;
  platformFeeMinor?: string;
}

interface FinancialOverview {
  totalVolumeMinor: string;
  platformEarnedMinor: string;
  storesPaidMinor: string;
  totalPaidOrders: number;
  totalAllOrders: number;
  totalStores: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [financials, setFinancials] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"seller" | "admin" | "super-admin">("seller");
  const [createHandle, setCreateHandle] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<"seller" | "admin" | "super-admin">("seller");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const [usersRes, overviewRes] = await Promise.allSettled([
        apiClient<AdminUser[]>("/api/admin/users"),
        apiClient<FinancialOverview>("/api/admin/overview"),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.data) {
        setUsers(usersRes.value.data);
      }
      if (overviewRes.status === "fulfilled" && overviewRes.value.data) {
        setFinancials(overviewRes.value.data);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatNaira = (minor: string | number) => {
    const num = Number(minor) / 100;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    try {
      const res = await apiClient<AdminUser>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          handle: createHandle.trim() || undefined,
          phone: createPhone.trim() || undefined,
        }),
      });

      if (res.data) {
        setUsers((prev) => [
          {
            ...res.data!,
            productCount: 0,
            orderCount: 0,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setShowCreateModal(false);
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateHandle("");
        setCreatePhone("");
        setCreateRole("seller");
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setRoleError("");
    setRoleSaving(true);

    try {
      const res = await apiClient(`/api/admin/users/${editingUser.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });

      if (res.status === "success") {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  role: newRole,
                  systemUser: newRole === "super-admin",
                }
              : u
          )
        );
        setEditingUser(null);
      }
    } catch (err: any) {
      setRoleError(err.message || "Failed to update role");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await apiClient(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.handle && u.handle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === "ALL"
        ? true
        : roleFilter === "SUPER_ADMIN"
        ? u.role === "super-admin" || u.systemUser === true
        : roleFilter === "ADMIN"
        ? u.role === "admin"
        : u.role === "seller" || (!u.role && !u.systemUser);

    return matchesSearch && matchesRole;
  });

  const totalSellers = users.filter((u) => u.role === "seller" || !u.role).length;
  const totalAdmins = users.filter((u) => u.role === "admin" || u.role === "super-admin" || u.systemUser).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Platform Overview & Store Payouts
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Real-time platform fee earnings, total store sales, and registered merchant stores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={refreshing}
            className="liquid-glass-button p-2.5 rounded-xl text-white/70 hover:text-white cursor-pointer"
            title="Refresh Admin Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:opacity-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Store Account
          </button>
        </div>
      </div>

      {/* Primary Financial Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platform Revenue (Fee Earned) */}
        <div className="liquid-glass-card rounded-2xl p-5 space-y-2 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-transparent">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Platform Fee Earned
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              Net Profit
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">
            {formatNaira(financials?.platformEarnedMinor || "0")}
          </p>
          <p className="text-[11px] text-white/40">Total revenue retained from processed orders</p>
        </div>

        {/* Paid Out / Sent to Stores */}
        <div className="liquid-glass-card rounded-2xl p-5 space-y-2 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] via-transparent to-transparent">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4" />
              Sent to Stores
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              Merchant Payouts
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-cyan-400">
            {formatNaira(financials?.storesPaidMinor || "0")}
          </p>
          <p className="text-[11px] text-white/40">Settled to store bank accounts via Paystack</p>
        </div>

        {/* Total GMV (Gross Merchandise Volume) */}
        <div className="liquid-glass-card rounded-2xl p-5 space-y-2 border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.07] via-transparent to-transparent">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Total Sales Volume (GMV)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              GMV
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatNaira(financials?.totalVolumeMinor || "0")}
          </p>
          <p className="text-[11px] text-white/40">
            Across {financials?.totalPaidOrders || 0} successful customer checkouts
          </p>
        </div>

        {/* Registered Store Accounts */}
        <div className="liquid-glass-card rounded-2xl p-5 space-y-2 border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              Registered Stores
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              Sellers
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">
            {users.length}
          </p>
          <p className="text-[11px] text-white/40">
            {users.reduce((acc, u) => acc + (u.productCount || 0), 0)} products listed across all stores
          </p>
        </div>
      </div>

      {/* Filter and Search Bar for Stores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores by name, email, or @handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="font-mono text-emerald-400 font-bold">{filteredUsers.length}</span> stores listed
        </div>
      </div>

      {/* Stores Directory Table */}
      <div className="liquid-glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.02] text-white/40 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Store / Merchant</th>
                <th className="py-3.5 px-4 text-center">Products</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Store Revenue</th>
                <th className="py-3.5 px-4 text-right">Platform Fee</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    Loading stores...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    No store accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isSuper = u.role === "super-admin" || u.systemUser === true;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 uppercase text-xs shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              u.name.slice(0, 1)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                                  You
                                </span>
                              )}
                              {isSuper && !isSelf && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/40 font-mono">{u.email}</div>
                            {u.handle && (
                              <a
                                href={`/${u.handle}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 mt-0.5 font-mono"
                              >
                                @{u.handle} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-white/80">
                        {u.productCount}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-white/80">
                        {u.orderCount}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                        {formatNaira(u.sellerEarnedMinor || "0")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatNaira(u.platformFeeMinor || "0")}
                      </td>

                      <td className="py-3.5 px-4 text-white/40 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setNewRole((u.role as any) || "seller");
                              setRoleError("");
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Edit Role / Privileges"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Delete Store"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Create Platform Account
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Full Name / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Lagos Footwear Co."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Account Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Role</label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="seller">Seller (Shop)</option>
                      <option value="admin">Platform Admin</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/80">Handle (Optional)</label>
                    <input
                      type="text"
                      value={createHandle}
                      onChange={(e) => setCreateHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                      placeholder="e.g. lagos-shoes"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {createError && <p className="text-xs text-rose-400 font-semibold">{createError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {createLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  Update User Role
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-white/50">Target User</p>
                <p className="text-sm font-bold text-white">{editingUser.name}</p>
                <p className="text-xs font-mono text-white/40">{editingUser.email}</p>
              </div>

              <form onSubmit={handleUpdateRole} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Assigned Privilege Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="seller">Seller (Shop Merchant)</option>
                    <option value="admin">Platform Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>

                {roleError && <p className="text-xs text-rose-400 font-semibold">{roleError}</p>}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roleSaving}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {roleSaving ? "Updating..." : "Save Role"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 text-center space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete User Account?</h3>
                <p className="text-xs text-white/50">
                  Are you sure you want to delete <span className="text-white font-bold">{deletingUser.name}</span> ({deletingUser.email})?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
