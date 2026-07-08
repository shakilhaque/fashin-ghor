'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, X } from 'lucide-react';
import type { Story } from '@ecommerce/types';
import { useTrackStoryView } from '@/hooks/use-stories';
import { cn } from '@/lib/utils';

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [storyIdx, setStoryIdx] = useState(initialStoryIndex);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackView = useTrackStoryView();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const goNextRef = useRef<() => void>(() => {});
  const touchStartX = useRef(0);

  const story = stories[storyIdx];
  const slide = story?.slides[slideIdx];
  const duration = (slide?.duration ?? 5) * 1000;

  const goNext = useCallback(() => {
    if (!story) return;
    if (slideIdx < story.slides.length - 1) {
      setSlideIdx((s) => s + 1);
    } else if (storyIdx < stories.length - 1) {
      const nextIdx = storyIdx + 1;
      setStoryIdx(nextIdx);
      setSlideIdx(0);
      trackView.mutate(stories[nextIdx].id);
    } else {
      onClose();
    }
  }, [story, storyIdx, slideIdx, stories, onClose, trackView]);

  const goPrev = useCallback(() => {
    if (slideIdx > 0) {
      setSlideIdx((s) => s - 1);
    } else if (storyIdx > 0) {
      setStoryIdx((s) => s - 1);
      setSlideIdx(0);
    }
  }, [storyIdx, slideIdx]);

  // Keep goNext ref current so the timer can always call the latest version
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  // Auto-play timer
  useEffect(() => {
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (paused) return;

    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNextRef.current();
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storyIdx, slideIdx, duration, paused]);

  // Track view on story open/change
  useEffect(() => {
    if (story?.id) trackView.mutate(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIdx]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNextRef.current();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, goPrev]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Prev story arrow (desktop) */}
      {storyIdx > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
          aria-label="Previous story"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next story arrow (desktop) */}
      {storyIdx < stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNextRef.current(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
          aria-label="Next story"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Story panel */}
      <div
        className="relative w-full max-w-[400px] mx-auto"
        style={{ height: 'calc(100svh - 32px)', maxHeight: '720px' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(diff) > 48) {
            if (diff < 0) goNextRef.current();
            else goPrev();
          }
        }}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-2.5">
          {story.slides.map((s, i) => (
            <div
              key={s.id}
              className="h-[2.5px] flex-1 rounded-full bg-white/35 overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < slideIdx ? '100%' : i === slideIdx ? `${progress}%` : '0%',
                  transition: i === slideIdx ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-0 right-0 z-20 flex items-center justify-between px-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold ring-2 ring-white/40">
              {story.title.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-snug drop-shadow">{story.title}</p>
              {story.subtitle && (
                <p className="text-white/60 text-[11px] leading-snug">{story.subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close story viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Media area */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden bg-black"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onMouseLeave={() => setPaused(false)}
        >
          {slide ? (
            slide.mediaType === 'VIDEO' ? (
              <video
                key={`${storyIdx}-${slideIdx}`}
                src={slide.mediaUrl}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                key={`${storyIdx}-${slideIdx}`}
                src={slide.mediaUrl}
                alt={slide.caption ?? story.title}
                fill
                className="object-cover"
                sizes="400px"
                priority
              />
            )
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
              <p className="text-white text-xl font-bold px-6 text-center">{story.title}</p>
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

          {/* Nav zones (invisible tap targets) */}
          <div
            className="absolute inset-y-0 left-0 w-2/5 z-10 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          />
          <div
            className="absolute inset-y-0 right-0 w-3/5 z-10 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); goNextRef.current(); }}
          />

          {/* Caption + Visit Now (bottom-left, matches product-story reference layout) */}
          {(slide?.caption || slide?.product) && (
            <div className="absolute bottom-8 left-5 right-5 z-20 flex flex-col items-start gap-3">
              {slide?.caption && (
                <p className="max-w-[85%] text-lg font-bold leading-snug text-white drop-shadow-lg pointer-events-none">
                  {slide.caption}
                </p>
              )}
              {slide?.product && (
                <Link
                  href={`/product/${slide.product.slug}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2 rounded-full bg-primary px-6 py-2.5',
                    'text-sm font-semibold text-primary-foreground shadow-xl hover:opacity-90 transition-opacity',
                  )}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Visit Now
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
