'use client';

import { useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/container';
import type { Story } from '@ecommerce/types';

interface StoriesCarouselProps {
  stories: Story[];
  onStoryClick: (story: Story, index: number) => void;
}

export function StoriesCarousel({ stories, onStoryClick }: StoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(stories.length > 5);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  function scrollBy(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }

  if (!stories.length) return null;

  return (
    <section className="relative bg-background py-6 border-b border-border">
      <Container>
        <div className="relative">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBy('left')}
              className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scrollBy('right')}
              className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md border border-border hover:bg-secondary transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Scroll container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={() => onStoryClick(story, index)}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex-none w-[110px] sm:w-[130px] rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Open story: ${story.title}`}
    >
      {/* Aspect ratio container */}
      <div className="aspect-[9/16] relative bg-secondary rounded-2xl overflow-hidden">
        {/* Cover image */}
        {story.coverImage ? (
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            className={cn(
              'object-cover transition-transform duration-500',
              hovered && 'scale-105',
            )}
            sizes="(max-width: 640px) 110px, 130px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />

        {/* Story ring (primary color border) */}
        <div className="absolute inset-0 rounded-2xl ring-[2.5px] ring-primary ring-offset-0 pointer-events-none" />

        {/* Slide count badge */}
        {story.slides.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <Play className="h-2 w-2 fill-white text-white" />
            <span className="text-[9px] font-semibold text-white">{story.slides.length}</span>
          </div>
        )}

        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
            {story.title}
          </p>
          {story.subtitle && (
            <p className="mt-0.5 text-[9px] text-white/70 line-clamp-1">{story.subtitle}</p>
          )}
        </div>
      </div>
    </button>
  );
}
