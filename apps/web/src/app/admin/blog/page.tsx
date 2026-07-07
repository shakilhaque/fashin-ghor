'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Globe, FileText, Archive, Search, BookOpen } from 'lucide-react';
import { useAdminBlogPosts, useAdminBlogStats, useDeleteBlogPost, useUpdateBlogPost, type BlogPost } from '@/hooks/use-blog';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-secondary text-muted-foreground',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PUBLISHED: <Globe className="h-3 w-3" />,
  DRAFT: <FileText className="h-3 w-3" />,
  ARCHIVED: <Archive className="h-3 w-3" />,
};

function PostRow({ post }: { post: BlogPost }) {
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();

  return (
    <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-sm line-clamp-1">{post.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{post.slug}</div>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
        {post.category?.name ?? '—'}
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
        {post.author.name}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[post.status]}`}>
          {STATUS_ICON[post.status]}
          {post.status}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">
        {post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 justify-end">
          {post.status !== 'PUBLISHED' && (
            <button
              onClick={() => updatePost.mutate({ id: post.id, status: 'PUBLISHED' })}
              disabled={updatePost.isPending}
              className="rounded px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {post.status === 'PUBLISHED' && (
            <button
              onClick={() => updatePost.mutate({ id: post.id, status: 'DRAFT' })}
              disabled={updatePost.isPending}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
          <Link
            href={`/admin/blog/${post.id}`}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => {
              if (confirm(`Delete "${post.title}"?`)) deletePost.mutate(post.id);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminBlogPage() {
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: statsData } = useAdminBlogStats();
  const stats = statsData ?? { draft: 0, published: 0, archived: 0, total: 0 };

  const { data, isLoading } = useAdminBlogPosts({
    page,
    status: activeStatus || undefined,
    search: search || undefined,
  });
  const posts = data?.data.posts ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Blog</h1>
            <p className="text-sm text-muted-foreground">Manage posts and categories</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/categories"
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
          >
            Categories
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Published</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Archived</p>
          <p className="text-2xl font-bold text-muted-foreground">{stats.archived}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border bg-background overflow-hidden">
          {STATUS_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setActiveStatus(value); setPage(1); }}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activeStatus === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="relative flex-1 min-w-48"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search posts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/30">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground">Title</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Author</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={6} className="py-4 px-4">
                    <div className="h-4 rounded bg-secondary/50 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  No posts found
                </td>
              </tr>
            ) : (
              posts.map((post) => <PostRow key={post.id} post={post} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary">Previous</button>
          <span className="px-3 py-2 text-sm text-muted-foreground">{meta.page} / {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary">Next</button>
        </div>
      )}
    </div>
  );
}
