"use client";
import React, { useEffect, useState } from 'react';
import ScrollReveal from '@/components/ui/scroll-reveal';
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import AddressDashboard from "@/components/ui/address-dashboard";
import { PlusCircle, LogOut, User, Shield, ExternalLink, Settings, Upload } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();

  // Store profile fields
  const [storeName, setStoreName] = useState("");
  const [storeBio, setStoreBio] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAvatarUrl, setStoreAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeError, setStoreError] = useState("");
  const [storeSuccess, setStoreSuccess] = useState(false);

  // Load current user data into form when ready
  useEffect(() => {
    if (user) {
      setStoreName(user.name || "");
      setStoreBio(user.bio || "");
      setStorePhone(user.phone || "");
      setStoreAvatarUrl(user.avatarUrl || "");
    }
  }, [user]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      setStoreError("");
      const url = await uploadToCloudinary(file);
      setStoreAvatarUrl(url);
    } catch (err: any) {
      setStoreError(err.message || "Failed to upload profile photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreError("Store name cannot be empty");
      return;
    }
    setStoreSaving(true);
    setStoreError("");
    try {
      const res = await apiClient<{ status: string; user: any; message?: string }>("/api/auth/profile", {
        method: "POST",
        body: JSON.stringify({
          name: storeName.trim(),
          bio: storeBio.trim() || undefined,
          phone: storePhone.trim() || undefined,
          avatarUrl: storeAvatarUrl || undefined,
        }),
      });
      if (res.user) {
        updateUser(res.user);
        setStoreSuccess(true);
        setTimeout(() => setStoreSuccess(false), 1500);
      }
    } catch (err: any) {
      setStoreError(err.message || "Failed to update store details");
    } finally {
      setStoreSaving(false);
    }
  };

  if (loading) return null;

  return (<ScrollReveal>
    <section className="min-h-screen bg-[#050505] text-[#e5e4e2] py-8">
      <div className="max-w-3xl mx-auto p-6 bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-emerald-200">Store Profile</h2>
        <form onSubmit={handleSaveStoreProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              {storeAvatarUrl ? (
                <img src={storeAvatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <label className="absolute inset-0 cursor-pointer opacity-0">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileSelect} />
                <Upload className="absolute bottom-0 right-0 w-5 h-5 text-emerald-400" />
              </label>
            </div>
            <div className="flex-1">
              <input
                placeholder="Store Name"
                className="w-full p-2 bg-[#222] text-white rounded"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
          </div>
          <textarea
            placeholder="Store Bio"
            className="w-full p-2 bg-[#222] text-white rounded h-24"
            value={storeBio}
            onChange={(e) => setStoreBio(e.target.value)}
          />
          <input
            placeholder="Contact Phone"
            className="w-full p-2 bg-[#222] text-white rounded"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
          />
          {storeError && <p className="text-red-500 text-sm">{storeError}</p>}
          {storeSuccess && <p className="text-emerald-400 text-sm">Saved!</p>}
          <button
            type="submit"
            disabled={storeSaving}
            className="px-4 py-2 bg-emerald-500 text-black rounded"
          >
            {storeSaving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Addresses section */}
      <div className="mt-10 max-w-3xl mx-auto p-6 bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-emerald-400">Addresses</h2>
        <AddressDashboard />
      </div>
    </section>
</ScrollReveal>
  );
}
