'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, FileText } from 'lucide-react';
import {
  useAdminBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useBlogCategories,
} from '@/hooks/use-blog';

function toSlug(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function BlogPostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const { data: existing, isLoading } = useAdminBlogPost(isNew ? '' : id);
  const { data: categories = [] } = useBlogCategories();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setSlugEdited(true);
      setExcerpt(existing.excerpt ?? '');
      setContent(existing.content ?? '');
      setCoverImage(existing.coverImage ?? '');
      setCategoryId(existing.categoryId ?? '');
      setTags(existing.tags.join(', '));
      setStatus(existing.status);
      setMetaTitle(existing.metaTitle ?? '');
      setMetaDesc(existing.metaDesc ?? '');
    }
  }, [existing]);

  // Auto-generate slug from title for new posts
  useEffect(() => {
    if (!isNew || slugEdited) return;
    setSlug(toSlug(title));
  }, [title, isNew, slugEdited]);

  const handleSave = async (publishStatus?: typeof status) => {
    setError('');
    const finalStatus = publishStatus ?? status;
    const dto = {
      title, slug, excerpt: excerpt || undefined, content, coverImage: coverImage || undefined,
      categoryId: categoryId || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: finalStatus,
      metaTitle: metaTitle || undefined,
      metaDesc: metaDesc || undefined,
    };

    try {
      if (isNew) {
        const post = await createPost.mutateAsync(dto);
        router.push(`/admin/blog/${post.id}`);
      } else {
        await updatePost.mutateAsync({ id, ...dto });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to save post');
    }
  };

  const isSaving = createPost.isPending || updatePost.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-secondary/50" />
        <div className="h-64 rounded-xl bg-secondary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="rounded-lg border border-border p-2 hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold">{isNew ? 'New Post' : 'Edit Post'}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={!title || !content || isSaving}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-50"
          >
            <FileText className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={!title || !content || isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Globe className="h-4 w-4" />
            {isSaving ? 'Saving…' : status === 'PUBLISHED' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Post title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Slug</label>
            <div className="mt-1 flex rounded-lg border border-border overflow-hidden">
              <span className="flex items-center bg-secondary/50 px-3 text-xs text-muted-foreground border-r border-border">/blog/</span>
              <input
                className="flex-1 bg-background px-3 py-2 text-sm focus:outline-none"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Excerpt</label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Brief summary shown in post cards…"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Content * <span className="text-xs text-muted-foreground">(HTML supported)</span></label>
            <textarea
              rows={20}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              placeholder="Write your post content here. HTML tags like <h2>, <p>, <strong>, <ul> are supported…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h3 className="font-semibold text-sm">Status</h3>
            <div className="flex flex-col gap-2">
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-primary"
                  />
                  <span className={s === 'PUBLISHED' ? 'text-emerald-600 font-medium' : s === 'ARCHIVED' ? 'text-muted-foreground' : 'text-amber-600 font-medium'}>
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h3 className="font-semibold text-sm">Category</h3>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Cover image */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h3 className="font-semibold text-sm">Cover Image</h3>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://…"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            {coverImage && (
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border">
                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h3 className="font-semibold text-sm">Tags</h3>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="fashion, style, trends"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          {/* SEO */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <h3 className="font-semibold text-sm">SEO</h3>
            <div>
              <label className="text-xs text-muted-foreground">Meta Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Meta Description</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
              />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={() => handleSave()}
            disabled={!title || !content || isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
