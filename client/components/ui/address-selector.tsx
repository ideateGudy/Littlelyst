"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  onCreate: (addr: Address) => void;
}

/**
 * Dropdown of saved addresses for a signed-in user plus a small inline form to add a new one.
 */
export default function AddressSelector({ selected, onSelect, onCreate }: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({});

  // Load saved addresses when user is logged in
  useEffect(() => {
    if (!user) return;
    apiClient<Address[]>("/api/addresses")
      .then((res) => setAddresses(res.data ?? []))
      .catch(() => toast({ title: "Failed to load saved addresses", variant: "destructive" }));
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    try {
      const resp = await apiClient<Address>("/api/addresses", {
        method: "POST",
        body: JSON.stringify(newAddr),
      });
      const created = resp.data;
      if (created) {
        setAddresses((prev) => [...prev, created]);
        onCreate(created);
        toast({ title: "Address saved", variant: "default" });
      } else {
        toast({ title: "Failed to save address", variant: "destructive" });
      }
      setShowNew(false);
    } catch {
      toast({ title: "Could not save address", variant: "destructive" });
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Delivery address</label>

      {/* Saved address dropdown */}
      <select
        className="w-full p-2 bg-[#111] text-white border border-gray-600 rounded"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        disabled={!addresses.length}
      >
        <option value="">Select saved address…</option>
        {addresses.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label} – {a.line1}, {a.city}
          </option>
        ))}
      </select>

      {/* Add-new button */}
      <button
        type="button"
        className="mt-2 flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
        onClick={() => setShowNew((v) => !v)}
      >
        <Plus size={16} />
        {showNew ? "Cancel" : "Add new address"}
      </button>

      {/* New address form */}
      {showNew && (
        <div className="mt-3 p-4 bg-[#111] border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Label (Home, Work…)"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.label ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
            />
            <input
              placeholder="Line 1"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.line1 ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
            />
            <input
              placeholder="Line 2"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.line2 ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
            />
            <input
              placeholder="City"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.city ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
            />
            <input
              placeholder="State"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.state ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
            />
            <input
              placeholder="ZIP / Postcode"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.zip ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })}
            />
            <input
              placeholder="Country"
              className="p-2 bg-[#222] text-white rounded"
              value={newAddr.country ?? ""}
              onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
            />
          </div>
          <button
            type="button"
            className="mt-3 px-4 py-2 bg-emerald-500 text-black rounded"
            onClick={handleCreate}
          >
            Save address
          </button>
        </div>
      )}
    </div>
  );
}
