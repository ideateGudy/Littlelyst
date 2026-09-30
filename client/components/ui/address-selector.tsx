"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
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
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Structured fields for direct entry
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"fields" | "textarea">("fields");

  useEffect(() => {
    if (!user) return;
    apiClient<Address[]>("/api/addresses")
      .then((res) => {
        if (res.data) setAddresses(res.data);
      })
      .catch(() => {});
  }, [user]);

  const formatAddress = (a: Partial<Address>) => {
    const parts = [a.line1, a.line2, a.city, a.state, a.country || "Nigeria"].filter(Boolean);
    return parts.join(", ");
  };

  const handleSelectSaved = (id: string) => {
    setSelectedAddrId(id);
    const selected = addresses.find((a) => a.id === id);
    if (selected) {
      const formatted = formatAddress(selected);
      onChange(formatted);
      setStreet(selected.line1);
      setCity(selected.city);
      setState(selected.state || "");
    }
  };

  const updateCombinedAddress = (newStreet: string, newCity: string, newState: string) => {
    const parts = [newStreet, newCity, newState, "Nigeria"].filter(Boolean);
    const combined = parts.join(", ");
    onChange(combined);
  };

  const handleCreate = async () => {
    const payload = {
      label: label.trim() || "Home",
      line1: street.trim() || "",
      line2: "",
      city: city.trim() || state || "Lagos",
      state: state || "Lagos",
      zip: "100001",
      country: "Nigeria",
    };

    if (!payload.line1) {
      toast({ title: "Please enter a street address", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const resp = await apiClient<Address>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const created = resp.data;
      if (created) {
        setAddresses((prev) => [...prev, created]);
        setSelectedAddrId(created.id);
        const formatted = formatAddress(created);
        onChange(formatted);
        toast({ title: "Address saved to account!", variant: "default" });
        setShowNew(false);
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
          <span>Delivery Address</span>
        </label>
        {user && (
          <button
            type="button"
            onClick={() => {
              setShowNew((v) => !v);
              if (!showNew) {
                setStreet("");
                setCity("");
                setState("");
              }
            }}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{showNew ? "Cancel" : "Add & Save Address"}</span>
          </button>
        )}
      </div>

      {/* Dropdown for saved addresses if user is logged in */}
      {user && addresses.length > 0 && !showNew && (
        <select
          value={selectedAddrId}
          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none mb-2"
          onChange={(e) => handleSelectSaved(e.target.value)}
        >
          <option value="" disabled>
            Select from your saved addresses...
          </option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id} className="bg-gray-900 text-white">
              {a.label}: {a.line1}, {a.city} {a.state ? `(${a.state})` : ""}
            </option>
          ))}
        </select>
      )}

      {/* Add New Address Form (for logged-in user saving to account) */}
      {showNew ? (
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              placeholder="Label (Home, Office)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-white placeholder-white/30"
            />
            <input
              placeholder="Street Address Line 1 *"
              value={street}
              onChange={(e) => {
                setStreet(e.target.value);
                updateCombinedAddress(e.target.value, city, state);
              }}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-white placeholder-white/30"
            />
            <input
              placeholder="City *"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                updateCombinedAddress(street, e.target.value, state);
              }}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-white placeholder-white/30"
            />
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                updateCombinedAddress(street, city, e.target.value);
              }}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-2 text-white"
            >
              <option value="">Select State (Nigeria)</option>
              {NIGERIA_STATES.map((s) => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleCreate}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? "Saving to account..." : "Save Address to Account & Use"}</span>
          </button>
        </div>
      ) : (
        /* Direct Entry Form with State Dropdown for Guest / Quick Entry */
        <div className="space-y-2">
          {mode === "fields" ? (
            <div className="space-y-2 text-xs">
              <input
                required
                placeholder="Street Address (e.g. 12 Admiralty Way, Lekki Phase 1) *"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  updateCombinedAddress(e.target.value, city, state);
                }}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="City (e.g. Ikeja, Lekki, Port Harcourt) *"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    updateCombinedAddress(street, e.target.value, state);
                  }}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
                />
                <select
                  required
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    updateCombinedAddress(street, city, e.target.value);
                  }}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">Select State (Nigeria)</option>
                  {NIGERIA_STATES.map((s) => (
                    <option key={s} value={s} className="bg-gray-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/40 px-1">
                <span>Optimized for delivery in Nigeria</span>
                <button
                  type="button"
                  onClick={() => setMode("textarea")}
                  className="text-emerald-400 hover:underline"
                >
                  Switch to full text input
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <textarea
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-emerald-400 focus:outline-none"
              />
              <div className="flex justify-end text-[10px] text-white/40 px-1">
                <button
                  type="button"
                  onClick={() => setMode("fields")}
                  className="text-emerald-400 hover:underline"
                >
                  Switch to structured fields & state dropdown
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
