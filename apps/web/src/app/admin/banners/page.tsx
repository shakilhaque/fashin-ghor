'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ImageIcon, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner,
  type PromoBanner,
} from '@/hooks/use-banners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { cn } from '@/lib/utils';

type BannerType = 'HERO' | 'SLIDER' | 'STATIC' | 'OFFER_ZONE';
type BannerSize = 'SMALL' | 'MEDIUM' | 'LARGE';

interface BannerForm {
  title: string;
  subtitle: string;
  badgeText: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  type: BannerType;
  size: BannerSize;
  position: string;
  isActive: boolean;
}

const emptyForm = (): BannerForm => ({
  title: '',
  subtitle: '',
  badgeText: '',
  imageUrl: '',
  linkUrl: '',
  linkLabel: '',
  type: 'SLIDER',
  size: 'LARGE',
  position: '0',
  isActive: true,
});

function bannerToForm(b: PromoBanner): BannerForm {
  return {
    title: b.title ?? '',
    subtitle: b.subtitle ?? '',
    badgeText: b.badgeText ?? '',
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl ?? '',
    linkLabel: b.linkLabel ?? '',
    type: b.type,
    size: b.size ?? 'LARGE',
    position: String(b.position),
    isActive: b.isActive,
  };
}

const SIZE_LABELS: Record<BannerSize, string> = {
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

const TYPE_LABELS: Record<BannerType, string> = {
  HERO: 'Hero',
  SLIDER: 'Slider',
  STATIC: 'Static',
  OFFER_ZONE: 'Offer Zone',
};

const TYPE_COLORS: Record<BannerType, string> = {
  HERO: 'bg-amber-100 text-amber-700',
  SLIDER: 'bg-blue-100 text-blue-700',
  STATIC: 'bg-violet-100 text-violet-700',
  OFFER_ZONE: 'bg-rose-100 text-rose-700',
};

export default function AdminBannersPage() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PromoBanner | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm());

  const heroes = banners.filter((b) => b.type === 'HERO');
  const sliders = banners.filter((b) => b.type === 'SLIDER');
  const statics = banners.filter((b) => b.type === 'STATIC');
  const offerZones = banners.filter((b) => b.type === 'OFFER_ZONE');

  function openCreate(defaultType?: BannerType) {
    setEditTarget(null);
    setForm({ ...emptyForm(), type: defaultType ?? 'SLIDER', position: String(banners.length) });
    setDialogOpen(true);
  }

  function openEdit(b: PromoBanner) {
    setEditTarget(b);
    setForm(bannerToForm(b));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      position: Number(form.position),
      title: form.title || undefined,
      subtitle: form.subtitle || undefined,
      badgeText: form.badgeText || undefined,
      linkUrl: form.linkUrl || undefined,
      linkLabel: form.linkLabel || undefined,
    };
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function toggleActive(b: PromoBanner) {
    await updateMutation.mutateAsync({ id: b.id, isActive: !b.isActive });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Promo Banners</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage homepage slider and static promotional banners
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: banners.length, Icon: ImageIcon },
          { label: 'Slider', value: sliders.length, Icon: Layers },
          { label: 'Active', value: banners.filter((b) => b.isActive).length, Icon: ToggleRight },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">{label}</span>
            </div>
            <p className="font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Hero Banners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Hero Banners ({heroes.length})
          </h2>
          <button onClick={() => openCreate('HERO')} className="text-xs text-primary hover:underline">+ Add Hero</button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Shown in the large rotating banner at the very top of the homepage.
        </p>
        <BannerGrid
          banners={heroes}
          isLoading={isLoading}
          onEdit={openEdit}
          onToggle={toggleActive}
          onDelete={(id) => { if (confirm('Delete this banner?')) deleteMutation.mutate(id); }}
          isPending={deleteMutation.isPending || updateMutation.isPending}
        />
      </div>

      {/* Slider Banners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Slider Banners ({sliders.length})
          </h2>
          <button onClick={() => openCreate('SLIDER')} className="text-xs text-primary hover:underline">+ Add Slider</button>
        </div>
        <BannerGrid
          banners={sliders}
          isLoading={isLoading}
          onEdit={openEdit}
          onToggle={toggleActive}
          onDelete={(id) => { if (confirm('Delete this banner?')) deleteMutation.mutate(id); }}
          isPending={deleteMutation.isPending || updateMutation.isPending}
        />
      </div>

      {/* Static Banners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Static Banners ({statics.length})
          </h2>
          <button onClick={() => openCreate('STATIC')} className="text-xs text-primary hover:underline">+ Add Static</button>
        </div>
        <BannerGrid
          banners={statics}
          isLoading={isLoading}
          onEdit={openEdit}
          onToggle={toggleActive}
          onDelete={(id) => { if (confirm('Delete this banner?')) deleteMutation.mutate(id); }}
          isPending={deleteMutation.isPending || updateMutation.isPending}
        />
      </div>

      {/* Offer Zone Banners */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Offer Zone Banners ({offerZones.length})
          </h2>
          <button onClick={() => openCreate('OFFER_ZONE')} className="text-xs text-primary hover:underline">+ Add Offer Zone Banner</button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Shown as two promo images below "Exclusive Combo Deals" on the homepage. Set the Link URL to where you want clicks to go (e.g. /shop?isOnSale=true).
        </p>
        <BannerGrid
          banners={offerZones}
          isLoading={isLoading}
          onEdit={openEdit}
          onToggle={toggleActive}
          onDelete={(id) => { if (confirm('Delete this banner?')) deleteMutation.mutate(id); }}
          isPending={deleteMutation.isPending || updateMutation.isPending}
        />
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image */}
            <div>
              <Label>Banner Image *</Label>
              <div className="mt-1">
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  folder="banners"
                  label="Upload Banner Image"
                  aspect="landscape"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as BannerType }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="HERO">Hero</option>
                  <option value="SLIDER">Slider</option>
                  <option value="STATIC">Static</option>
                  <option value="OFFER_ZONE">Offer Zone</option>
                </select>
              </div>
              <div>
                <Label>Position</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {form.type === 'HERO' && (
              <div>
                <Label>Size</Label>
                <select
                  value={form.size}
                  onChange={(e) => setForm((f) => ({ ...f, size: e.target.value as BannerSize }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Controls the height of the homepage hero banner.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Big Sale This Weekend" className="mt-1" />
              </div>
              <div>
                <Label>Badge Text</Label>
                <Input value={form.badgeText} onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))} placeholder="New Arrival" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Up to 50% off on selected items" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Link URL</Label>
                <Input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="/shop?sale=true" className="mt-1" />
              </div>
              <div>
                <Label>Button Label</Label>
                <Input value={form.linkLabel} onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))} placeholder="Shop Now" className="mt-1" />
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
                {form.isActive ? 'Active (visible on homepage)' : 'Inactive (hidden)'}
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving || !form.imageUrl}>
                {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Banner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerGrid({
  banners, isLoading, onEdit, onToggle, onDelete, isPending,
}: {
  banners: PromoBanner[];
  isLoading: boolean;
  onEdit: (b: PromoBanner) => void;
  onToggle: (b: PromoBanner) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-video animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }
  if (banners.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-10 text-sm text-muted-foreground">
        No banners yet. Click "Add Banner" to get started.
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {banners.map((b) => (
        <div key={b.id} className={cn('group relative overflow-hidden rounded-xl border border-border bg-card', !b.isActive && 'opacity-60')}>
          <div className="relative aspect-video bg-secondary">
            <Image src={b.imageUrl} alt={b.title ?? 'Banner'} fill className="object-cover" sizes="400px" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate text-sm">{b.title ?? '(No title)'}</p>
                {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {b.type === 'HERO' && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {SIZE_LABELS[b.size ?? 'LARGE']}
                  </span>
                )}
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TYPE_COLORS[b.type])}>
                  {TYPE_LABELS[b.type]}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggle(b)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={b.isActive ? 'Deactivate' : 'Activate'}
                >
                  {b.isActive
                    ? <ToggleRight className="h-5 w-5 text-primary" />
                    : <ToggleLeft className="h-5 w-5" />}
                </button>
                <span className="text-xs text-muted-foreground">pos. {b.position}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(b)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDelete(b.id)}
                  disabled={isPending}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
