'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Tag, ArrowLeft, Clock } from 'lucide-react';
import { useBlogPost } from '@/hooks/use-blog';

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function ProseContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-neutral max-w-none
        prose-headings:font-display prose-headings:font-bold
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-xl
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-code:bg-secondary prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
        prose-pre:bg-secondary prose-pre:rounded-xl"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export function BlogView({ slug }: { slug: string }) {
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-4">
        <div className="h-10 w-2/3 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="h-64 rounded-xl bg-secondary/50 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 rounded bg-secondary/50 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-2xl font-bold">Post not found</p>
        <Link href="/blog" className="mt-4 flex items-center gap-1.5 text-primary hover:underline text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </div>
    );
  }

  const mins = post.content ? readingTime(post.content) : 1;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        {post.category && (
          <>
            <span>/</span>
            <Link href={`/blog?category=${post.category.slug}`} className="hover:text-foreground">
              {post.category.name}
            </Link>
          </>
        )}
      </nav>

      {post.category && (
        <Link
          href={`/blog?category=${post.category.slug}`}
          className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="mt-3 font-display text-3xl font-bold leading-snug sm:text-4xl">{post.title}</h1>

      {post.excerpt && (
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-3">
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4" /> {post.author.name}
        </span>
        {post.publishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {mins} min read
        </span>
      </div>

      {post.coverImage && (
        <div className="mt-8 relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-secondary">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      )}

      <div className="mt-10">
        {post.content ? (
          <ProseContent content={post.content} />
        ) : (
          <p className="text-muted-foreground italic">No content available.</p>
        )}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link href="/blog" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
      </div>
    </article>
  );
}
