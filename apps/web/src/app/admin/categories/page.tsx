'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, FolderTree, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { cn } from '@/lib/utils';
import type { Category } from '@ecommerce/types';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm = (): CategoryForm => ({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
});

function categoryToForm(c: Category): CategoryForm {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    imageUrl: c.imageUrl ?? '',
    parentId: c.parentId ?? '',
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
  };
}

// Flatten the tree into a display list, preserving parent > child order
function flatten(categories: Category[], depth = 0): { category: Category; depth: number }[] {
  return categories.flatMap((c) => [
    { category: c, depth },
    ...flatten(c.children ?? [], depth + 1),
  ]);
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm());

  const rows = flatten(categories);
  // Only top-level-or-other categories (excluding self and its own descendants) can be a parent
  const parentOptions = editTarget
    ? rows.filter((r) => r.category.id !== editTarget.id && r.category.parentId !== editTarget.id)
    : rows;

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(c: Category) {
    setEditTarget(c);
    setForm(categoryToForm(c));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      parentId: form.parentId || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function toggleActive(c: Category) {
    await updateMutation.mutateAsync({ id: c.id, isActive: !c.isActive });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Sub-categories will need to be removed or reassigned first.')) return;
    await deleteMutation.mutateAsync(id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize products into categories and sub-categories
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No categories yet</p>
            <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
              <Plus className="h-4 w-4" /> Create Category
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map(({ category: c, depth }) => (
              <div key={c.id} className="flex items-center gap-3 p-4" style={{ paddingLeft: `${16 + depth * 24}px` }}>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt={c.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
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
            <DialogTitle>{editTarget ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Men's Fashion"
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
                  folder="categories"
                  label="Upload Image"
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
                placeholder="Shop the latest in menswear"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Parent Category (optional)</Label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Top level —</option>
                  {parentOptions.map(({ category: p, depth }) => (
                    <option key={p.id} value={p.id}>
                      {'—'.repeat(depth)} {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
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
                {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
