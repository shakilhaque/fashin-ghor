'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Truck, Package, Globe } from 'lucide-react';
import { useAdminZones, useCreateZone, useUpdateZone, useDeleteZone, useCreateRate, useDeleteRate, type ShippingZone, type ShippingRate } from '@/hooks/use-shipping';

// ── Zone Form ────────────────────────────────────────────────────────────────

function ZoneForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<ShippingZone>;
  onSave: (v: { name: string; countries: string[] }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [countries, setCountries] = useState(initial?.countries?.join(', ') ?? '');

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <h3 className="font-semibold text-sm">{initial?.id ? 'Edit Zone' : 'New Zone'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Zone Name</label>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dhaka Metro"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Countries (comma-separated)</label>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="BD"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          disabled={!name.trim() || loading}
          onClick={() =>
            onSave({
              name: name.trim(),
              countries: countries.split(',').map((c) => c.trim()).filter(Boolean),
            })
          }
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Zone'}
        </button>
      </div>
    </div>
  );
}

// ── Rate Form ────────────────────────────────────────────────────────────────

function RateForm({
  zoneId,
  onSave,
  onCancel,
  loading,
}: {
  zoneId: string;
  onSave: (v: { zoneId: string; name: string; rate: number; minOrderAmt: number; isFree: boolean }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [isFree, setIsFree] = useState(false);

  return (
    <div className="mt-2 rounded-md border border-border bg-secondary/30 p-3 space-y-3">
      <h4 className="text-sm font-medium">Add Shipping Rate</h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Standard"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Rate (৳)</label>
          <input
            type="number"
            min="0"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="60"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Min Order (৳)</label>
          <input
            type="number"
            min="0"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="h-4 w-4 accent-primary" />
            Free
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-secondary">
          Cancel
        </button>
        <button
          disabled={!name.trim() || !rate || loading}
          onClick={() =>
            onSave({
              zoneId,
              name: name.trim(),
              rate: Number(rate),
              minOrderAmt: Number(minOrder) || 0,
              isFree,
            })
          }
          className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add Rate'}
        </button>
      </div>
    </div>
  );
}

// ── Zone Row ─────────────────────────────────────────────────────────────────

function ZoneRow({ zone }: { zone: ShippingZone }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingRate, setAddingRate] = useState(false);

  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const createRate = useCreateRate();
  const deleteRate = useDeleteRate();

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{zone.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {zone.countries.join(', ') || 'No countries'}
            <span className="ml-2">·</span>
            <span>{zone.rates.length} rate{zone.rates.length !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            zone.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
          }`}
        >
          {zone.isActive ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete zone "${zone.name}"? All rates will be removed.`)) {
              deleteZone.mutate(zone.id);
            }
          }}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {editing && (
        <div className="border-t border-border px-4 py-3">
          <ZoneForm
            initial={zone}
            loading={updateZone.isPending}
            onCancel={() => setEditing(false)}
            onSave={(dto) =>
              updateZone.mutate({ id: zone.id, ...dto }, { onSuccess: () => setEditing(false) })
            }
          />
        </div>
      )}

      {/* Rates */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {zone.rates.length === 0 && (
            <p className="text-xs text-muted-foreground">No rates yet. Add one below.</p>
          )}
          {zone.rates.map((r: ShippingRate) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{r.name}</span>
                {r.isFree ? (
                  <span className="ml-2 text-xs text-emerald-600 font-medium">FREE</span>
                ) : (
                  <span className="ml-2 text-xs text-muted-foreground">৳{r.rate}</span>
                )}
                {r.minOrderAmt > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">· min ৳{r.minOrderAmt}</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete rate "${r.name}"?`)) deleteRate.mutate(r.id);
                }}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {addingRate ? (
            <RateForm
              zoneId={zone.id}
              loading={createRate.isPending}
              onCancel={() => setAddingRate(false)}
              onSave={(dto) =>
                createRate.mutate(dto, { onSuccess: () => setAddingRate(false) })
              }
            />
          ) : (
            <button
              onClick={() => setAddingRate(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add Rate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminShippingPage() {
  const { data: zones, isLoading } = useAdminZones();
  const createZone = useCreateZone();
  const [addingZone, setAddingZone] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Shipping</h1>
            <p className="text-sm text-muted-foreground">Manage shipping zones and rates</p>
          </div>
        </div>
        <button
          onClick={() => setAddingZone(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Zone
        </button>
      </div>

      {/* Stats */}
      {zones && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs text-muted-foreground">Total Zones</p>
            <p className="text-2xl font-bold">{zones.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs text-muted-foreground">Active Zones</p>
            <p className="text-2xl font-bold text-emerald-600">{zones.filter((z) => z.isActive).length}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs text-muted-foreground">Total Rates</p>
            <p className="text-2xl font-bold">{zones.reduce((a, z) => a + z.rates.length, 0)}</p>
          </div>
        </div>
      )}

      {/* Add Zone Form */}
      {addingZone && (
        <ZoneForm
          loading={createZone.isPending}
          onCancel={() => setAddingZone(false)}
          onSave={(dto) =>
            createZone.mutate(dto, { onSuccess: () => setAddingZone(false) })
          }
        />
      )}

      {/* Zones */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : zones?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium">No shipping zones</p>
          <p className="text-sm text-muted-foreground mt-1">Add a zone to define shipping areas and rates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones?.map((zone) => <ZoneRow key={zone.id} zone={zone} />)}
        </div>
      )}
    </div>
  );
}
