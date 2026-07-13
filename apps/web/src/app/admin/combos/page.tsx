'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Gift, ToggleLeft, ToggleRight, X } from 'lucide-react';
import {
  useAdminCombos,
  useCreateCombo,
  useUpdateCombo,
  useDeleteCombo,
  type ComboInput,
} from '@/hooks/use-combos';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { cn, formatPrice } from '@/lib/utils';
import type { Combo } from '@ecommerce/types';

interface ComboItemForm {
  productId: string;
  quantity: string;
}

interface ComboForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: string;
  comparePrice: string;
  isActive: boolean;
  items: ComboItemForm[];
}

const emptyForm = (): ComboForm => ({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  price: '',
  comparePrice: '',
  isActive: true,
  items: [
    { productId: '', quantity: '1' },
    { productId: '', quantity: '1' },
  ],
});

function comboToForm(c: Combo): ComboForm {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    imageUrl: c.imageUrl ?? '',
    price: String(c.price),
    comparePrice: c.comparePrice ? String(c.comparePrice) : '',
    isActive: c.isActive,
    items: c.items.map((item) => ({ productId: item.productId, quantity: String(item.quantity) })),
  };
}

export default function AdminCombosPage() {
  const { data: combos = [], isLoading } = useAdminCombos();
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.products ?? [];

  const createMutation = useCreateCombo();
  const updateMutation = useUpdateCombo();
  const deleteMutation = useDeleteCombo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Combo | null>(null);
  const [form, setForm] = useState<ComboForm>(emptyForm());
  const [formError, setFormError] = useState('');

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(c: Combo) {
    setEditTarget(c);
    setForm(comboToForm(c));
    setFormError('');
    setDialogOpen(true);
  }

  function updateItem(index: number, patch: Partial<ComboItemForm>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function addItemRow() {
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', quantity: '1' }] }));
  }

  function removeItemRow(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const validItems = form.items.filter((item) => item.productId);
    if (validItems.length < 2) {
      setFormError('Select at least 2 products for this combo.');
      return;
    }
    const productIds = validItems.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      setFormError('Each product can only appear once in a combo.');
      return;
    }

    const payload: ComboInput = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      isActive: form.isActive,
      items: validItems.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) || 1 })),
    };

    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function toggleActive(c: Combo) {
    await updateMutation.mutateAsync({ id: c.id, isActive: !c.isActive });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this combo? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Combos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bundle 2 or more products together as a combo deal
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Combo
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : combos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Gift className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No combos yet</p>
            <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
              <Plus className="h-4 w-4" /> Create Combo
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {combos.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.name} fill className="object-contain" sizes="48px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.name}</p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500',
                      )}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatPrice(c.price)}</span>
                    {c.comparePrice && (
                      <span className="line-through">{formatPrice(c.comparePrice)}</span>
                    )}
                    {c.discount > 0 && <span className="text-emerald-600">Save {c.discount}%</span>}
                    <span>· {c.items.length} products</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={updateMutation.isPending}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={c.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {c.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleteMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Combo' : 'Add Combo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Combo Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Signature Mom-Daughter Set"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Slug (optional)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="Auto-generated from name if left blank"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Image (optional)</Label>
              <div className="mt-1 max-w-[160px]">
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  folder="combos"
                  label="Upload Image"
                  aspect="portrait"
                />
              </div>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Matching mother & daughter outfit set"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Combo Price *</Label>
                <Input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="1400"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Compare Price (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.comparePrice}
                  onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                  placeholder="1750"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items in this Combo * (2 or more)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItemRow} className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, { productId: e.target.value })}
                      className="h-9 flex-1 min-w-0 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">— Select product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      className="h-9 w-16 shrink-0 text-center"
                      title="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={form.items.length <= 2}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-40 disabled:hover:text-muted-foreground disabled:hover:border-border"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={cn('flex h-6 w-11 items-center rounded-full transition-colors', form.isActive ? 'bg-primary' : 'bg-border')}
              >
                <span className={cn('h-5 w-5 rounded-full bg-white shadow transition-transform', form.isActive ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
              <Label className="cursor-pointer" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                {form.isActive ? 'Active (visible to customers)' : 'Inactive (hidden)'}
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving || !form.name || !form.price}>
                {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Combo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
