'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useAdminBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from '@/hooks/use-brands';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { cn } from '@/lib/utils';
import type { Brand } from '@ecommerce/types';

interface BrandForm {
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  country: string;
  website: string;
  isActive: boolean;
}

const emptyForm = (): BrandForm => ({
  name: '',
  slug: '',
  logoUrl: '',
  description: '',
  country: '',
  website: '',
  isActive: true,
});

function brandToForm(b: Brand): BrandForm {
  return {
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl ?? '',
    description: b.description ?? '',
    country: b.country ?? '',
    website: b.website ?? '',
    isActive: b.isActive,
  };
}

export default function AdminBrandsPage() {
  const { data: brands = [], isLoading } = useAdminBrands();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm());

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(b: Brand) {
    setEditTarget(b);
    setForm(brandToForm(b));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      logoUrl: form.logoUrl || undefined,
      description: form.description || undefined,
      country: form.country || undefined,
      website: form.website || undefined,
      isActive: form.isActive,
    };
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function toggleActive(b: Brand) {
    await updateMutation.mutateAsync({ id: b.id, isActive: !b.isActive });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this brand?')) return;
    await deleteMutation.mutateAsync(id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the brands products can be assigned to
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Brand
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No brands yet</p>
            <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
              <Plus className="h-4 w-4" /> Create Brand
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-4">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {b.logoUrl ? (
                    <Image src={b.logoUrl} alt={b.name} fill className="object-contain" sizes="40px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground">
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{b.name}</p>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500',
                      )}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">/{b.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={updateMutation.isPending}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={b.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {b.isActive ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
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
            <DialogTitle>{editTarget ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Fashion Ghor Originals"
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
              <Label>Logo (optional)</Label>
              <div className="mt-1 max-w-[140px]">
                <ImageUploader
                  value={form.logoUrl}
                  onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))}
                  folder="brands"
                  label="Upload Logo"
                  aspect="square"
                />
              </div>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Premium in-house fashion label"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country (optional)</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="BD"
                  maxLength={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
            </div>

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
              <Button type="submit" disabled={isSaving || !form.name}>
                {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Brand'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
