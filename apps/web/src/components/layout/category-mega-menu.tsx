'use client';

import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useCategoryTree } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

export function CategoryMegaMenu() {
  const { data: categories, isLoading } = useCategoryTree();

  if (isLoading || !categories?.length) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1">
      {categories.map((category) => {
        const hasChildren = Boolean(category.children?.length);

        if (!hasChildren) {
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {category.name}
            </Link>
          );
        }

        return (
          <DropdownMenu.Root key={category.id}>
            <DropdownMenu.Trigger asChild>
              <Link
                href={`/category/${category.slug}`}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary',
                )}
              >
                {category.name}
                <ChevronDown className="h-3.5 w-3.5" />
              </Link>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={8}
                className="z-50 min-w-[220px] rounded-xl border border-border bg-card p-2 shadow-lg animate-slide-down"
              >
                {category.children?.map((child) => (
                  <DropdownMenu.Item key={child.id} asChild>
                    <Link
                      href={`/category/${child.slug}`}
                      className="block cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-secondary"
                    >
                      {child.name}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        );
      })}
    </nav>
  );
}
