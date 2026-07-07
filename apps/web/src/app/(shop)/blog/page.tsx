'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Tag, Calendar, User } from 'lucide-react';
import { useBlogPosts, useBlogCategories, type BlogPost } from '@/hooks/use-blog';

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-4xl font-bold text-muted-foreground/20">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            {post.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {post.author.name}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useBlogCategories();
  const categories = categoriesData ?? [];

  const { data, isLoading } = useBlogPosts({
    page,
    limit: 9,
    category: activeCategory || undefined,
    tag: activeTag || undefined,
    search: searchQuery || undefined,
  });

  const posts = data?.data.posts ?? [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleCategory = (slug: string) => {
    setActiveCategory(slug === activeCategory ? '' : slug);
    setActiveTag('');
    setPage(1);
  };

  // Collect all tags from visible posts
  const allTags = [...new Set(posts.flatMap((p) => p.tags))].slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-secondary/40 py-14 text-center px-4">
        <h1 className="font-display text-4xl font-bold">Style Journal</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Fashion insights, trend guides, and style tips from the LuxeMode team.
        </p>
        <form onSubmit={handleSearch} className="relative mt-6 mx-auto max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-28 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex gap-8 flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full lg:w-52 shrink-0 space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Categories</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleCategory('')}
                      className={`flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                        !activeCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      <span>All Posts</span>
                      <span className="text-xs">{meta?.total ?? ''}</span>
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategory(cat.slug)}
                        className={`flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                          activeCategory === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-xs">{cat._count?.posts ?? ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveTag(tag === activeTag ? '' : tag);
                        setPage(1);
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                        activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Posts grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-xl bg-secondary/50 animate-pulse" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="font-medium text-lg">No articles found</p>
                <p className="mt-2 text-sm text-muted-foreground">Try a different search or category.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {posts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>

                {meta && meta.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-muted-foreground">
                      {meta.page} / {meta.totalPages}
                    </span>
                    <button
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
