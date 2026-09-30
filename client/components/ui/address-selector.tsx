"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toast";
import { MapPin, Plus, Check } from "lucide-react";

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country?: string;
};

const NIGERIA_STATES = [
  "Lagos",
  "FCT - Abuja",
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface Props {
  value: string;
  onChange: (addressStr: string) => void;
  placeholder?: string;
}

export default function AddressSelector({
  value,
  onChange,
  placeholder = "12 Admiralty Way, Lekki Phase 1, Lagos",
}: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({ country: "Nigeria" });

  useEffect(() => {
    if (!user) return;
    apiClient<Address[]>("/api/addresses")
      .then((res) => {
        if (res.data) setAddresses(res.data);
      })
      .catch(() => {});
  }, [user]);

  const formatAddress = (a: Address) => {
    const parts = [a.line1, a.line2, a.city, a.state, a.country].filter(Boolean);
    return parts.join(", ");
  };

  const handleCreate = async () => {
    if (!newAddr.label || !newAddr.line1 || !newAddr.city) {
      toast({ title: "Label, Line 1, and City are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const resp = await apiClient<Address>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(newAddr),
      });
      const created = resp.data;
      if (created) {
        setAddresses((prev) => [...prev, created]);
        const formatted = formatAddress(created);
        onChange(formatted);
        toast({ title: "Address saved", variant: "default" });
        setShowNew(false);
        setNewAddr({ country: "Nigeria" });
      }
    } catch (err: any) {
      toast({ title: err.message || "Could not save address", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Delivery Address (Physical Products Only)</span>
        </label>
        {user && (
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{showNew ? "Cancel" : "Add saved address"}</span>
          </button>
        )}
      </div>

      {/* Dropdown for saved addresses if user is logged in and has addresses */}
      {user && addresses.length > 0 && !showNew && (
        <select
          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none mb-1.5"
          onChange={(e) => {
            const selected = addresses.find((a) => a.id === e.target.value);
            if (selected) {
              onChange(formatAddress(selected));
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Select from saved addresses...
          </option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id} className="bg-gray-900 text-white">
              {a.label}: {a.line1}, {a.city}
            </option>
          ))}
        </select>
      )}

      {/* New Address Form for Logged In user */}
      {showNew ? (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              placeholder="Label (Home, Office)"
              value={newAddr.label || ""}
              onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-white/30"
            />
            <input
              placeholder="Address Line 1 *"
              value={newAddr.line1 || ""}
              onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-white/30"
            />
            <input
              placeholder="Line 2 (Optional)"
              value={newAddr.line2 || ""}
              onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-white/30"
            />
            <input
              placeholder="City *"
              value={newAddr.city || ""}
              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-white/30"
            />
            <select
              value={newAddr.state || ""}
              onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="">Select State</option>
              {NIGERIA_STATES.map((s) => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {s}
                </option>
              ))}
            </select>
            <input
              placeholder="Country"
              value={newAddr.country || "Nigeria"}
              onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-white/30"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save & Select Address"}</span>
          </button>
        </div>
      ) : (
        <textarea
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
        />
      )}
    </div>
  );
}
