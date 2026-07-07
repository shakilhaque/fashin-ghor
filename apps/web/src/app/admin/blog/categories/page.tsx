'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useBlogCategories, useCreateBlogCategory, useDeleteBlogCategory } from '@/hooks/use-blog';

export default function BlogCategoriesPage() {
  const { data: categories = [], isLoading } = useBlogCategories();
  const createCategory = useCreateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createCategory.mutateAsync({ name, slug: slug || undefined });
      setName('');
      setSlug('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/blog" className="rounded-lg border border-border p-2 hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">Blog Categories</h1>
      </div>

      {/* Create form */}
      <div className="rounded-lg border border-border bg-background p-4">
        <h2 className="font-semibold text-sm mb-3">Add Category</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Fashion Tips"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-36">
            <label className="text-xs text-muted-foreground mb-1 block">Slug (optional)</label>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="fashion-tips"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!name || createCategory.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {createCategory.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-secondary/50 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No categories yet</p>
      ) : (
        <div className="rounded-lg border border-border bg-background divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.slug} · {cat._count?.posts ?? 0} posts</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.name}"?`)) deleteCategory.mutate(cat.id);
                }}
                className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
