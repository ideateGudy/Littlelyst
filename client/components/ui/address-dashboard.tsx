"use client";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';

// Simple loading placeholder
const LoadingPlaceholder = () => <p className="text-gray-400">Loading...</p>;
// Simple empty state placeholder
const EmptyState = () => <p className="text-gray-400">No addresses saved yet.</p>;

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

import { useAuth } from '@/lib/auth-context';

/** Dashboard UI to view and add addresses */

export default function AddressDashboard() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({});

  // Load addresses when user is ready
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiClient<Address[]>('/api/addresses')
      .then((res) => setAddresses(res.data ?? []))
      .catch(() => toast({ title: 'Failed to load addresses', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async () => {
    try {
      const resp = await apiClient<Address>('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(newAddr),
      });
      const created = resp.data;
      setAddresses((prev) => (created ? [...prev, created] : prev));
      toast({ title: 'Address saved', variant: 'default' });
      setNewAddr({});
      setShowForm(false);
    } catch {
      toast({ title: 'Could not save address', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-[#111] rounded shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">Your Saved Addresses</h2>
      {/* Loading state */}
      {loading && <LoadingPlaceholder />}
      {/* Address list */}
      {!loading && addresses.length > 0 && (
        <ul className="space-y-3 mb-6">
          {addresses.map((addr) => (
            <li key={addr.id} className="p-4 bg-[#222] border border-gray-600 rounded flex flex-col">
              <span className="font-medium text-emerald-400 mb-1">{addr.label}</span>
              <span>{addr.line1}</span>
              {addr.line2 && <span>{addr.line2}</span>}
              <span>{addr.city}, {addr.state} {addr.zip}</span>
              <span>{addr.country}</span>
            </li>
          ))}
        </ul>
      )}
      {/* Empty state */}
      {!loading && addresses.length === 0 && <EmptyState />}
      {/* Add new address button */}
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded"
        onClick={() => setShowForm((v) => !v)}
      >
        <Plus size={16} />
        {showForm ? 'Cancel' : 'Add new address'}
      </button>
      {/* New address form */}
      {showForm && (
        <div className="mt-4 p-4 bg-[#111] border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Label (Home, Work…)" className="p-2 bg-[#222] text-white rounded" value={newAddr.label ?? ''} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
            <input placeholder="Line 1" className="p-2 bg-[#222] text-white rounded" value={newAddr.line1 ?? ''} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
            <input placeholder="Line 2" className="p-2 bg-[#222] text-white rounded" value={newAddr.line2 ?? ''} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} />
            <input placeholder="City" className="p-2 bg-[#222] text-white rounded" value={newAddr.city ?? ''} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
            <input placeholder="State" className="p-2 bg-[#222] text-white rounded" value={newAddr.state ?? ''} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
            <input placeholder="ZIP / Postcode" className="p-2 bg-[#222] text-white rounded" value={newAddr.zip ?? ''} onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })} />
            <input placeholder="Country" className="p-2 bg-[#222] text-white rounded" value={newAddr.country ?? ''} onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })} />
          </div>
          <button type="button" className="mt-3 px-4 py-2 bg-emerald-500 text-black rounded" onClick={handleCreate}>Save address</button>
        </div>
      )}
    </div>
  );
}
