'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  Plus, Pencil, Trash2, Search, Package,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiImageUploader } from '@/components/admin/image-uploader';
import { formatPrice, cn } from '@/lib/utils';
import type { Product } from '@ecommerce/types';

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useAdminProducts(page: number, search: string) {
  return useQuery({
    queryKey: ['admin', 'products', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/products/admin/all?${params}`);
      return data as { data: { products: Product[] }; meta: { total: number; totalPages: number } };
    },
  });
}

function useCategories() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const { data } = await api.get('/categories/tree');
      return data.data.categories as { id: string; name: string; slug: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useBrands() {
  return useQuery({
    queryKey: ['brands', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/brands');
      return data.data.brands as { id: string; name: string; slug: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Form types ────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  categoryId: string;
  brandId: string;
  gender: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
}

const emptyForm = (): ProductForm => ({
  name: '', sku: '', description: '', price: '', comparePrice: '',
  stock: '0', categoryId: '', brandId: '', gender: '', isActive: true,
  isFeatured: false, images: [],
});

function productToForm(p: Product): ProductForm {
  const imgs = (p.images as { url: string }[] | undefined) ?? [];
  return {
    name: p.name,
    sku: p.sku ?? '',
    description: p.description ?? '',
    price: String(p.price),
    comparePrice: p.comparePrice ? String(p.comparePrice) : '',
    stock: String(p.stock ?? 0),
    categoryId: (p.category as { id: string } | undefined)?.id ?? '',
    brandId: (p.brand as { id: string } | undefined)?.id ?? '',
    gender: p.gender ?? '',
    isActive: p.isActive ?? true,
    isFeatured: p.isFeatured ?? false,
    images: imgs.map((i) => i.url),
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());

  const { data, isLoading } = useAdminProducts(page, search);
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const products = data?.data?.products ?? [];
  const meta = data?.meta;

  const createMutation = useMutation({
    mutationFn: async (payload: object) => { await api.post('/products', payload); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & object) => { await api.patch(`/products/${id}`, payload); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/products/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/products/${id}`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditTarget(p);
    setForm(productToForm(p));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock),
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      gender: form.gender || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      images: form.images.map((url, i) => ({ url, position: i, altText: form.name })),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{meta?.total ?? 0} total products</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Search products by name or SKU…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">SKU</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-secondary" /></td></tr>
                ))
              : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground">No products found</p>
                    </td>
                  </tr>
                )
              : products.map((p) => {
                  const img = (p.images as { url: string }[] | undefined)?.[0];
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                            {img ? (
                              <Image src={img.url} alt={p.name} fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{(p.brand as { name: string }).name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.price)}</td>
                      <td className={cn('px-4 py-3 text-right hidden sm:table-cell', p.stock === 0 && 'text-rose-600 font-medium')}>
                        {p.stock ?? 0}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {p.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button onClick={() => openEdit(p)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                            disabled={deleteMutation.isPending}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Images */}
            <div>
              <Label>Product Images</Label>
              <p className="text-xs text-muted-foreground mb-2">First image is the cover. Upload up to 8 images.</p>
              <MultiImageUploader
                values={form.images}
                onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
                folder="products"
                maxImages={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Classic Oxford Shirt" className="mt-1" />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SHIRT-001" className="mt-1 font-mono" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Price (৳) *</Label>
                <Input required type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="1299" className="mt-1" />
              </div>
              <div>
                <Label>Compare Price (৳)</Label>
                <Input type="number" min={0} step="0.01" value={form.comparePrice} onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))} placeholder="1799" className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Select category —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Brand</Label>
                <select value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Select brand —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Gender</Label>
                <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Any —</option>
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                  <option value="UNISEX">Unisex</option>
                  <option value="KIDS">Kids</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Product description…" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-primary" />
                Active (visible to customers)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="h-4 w-4 rounded accent-primary" />
                Featured (show on homepage)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Product'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
