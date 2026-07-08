'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Film,
  X,
  ImageIcon,
  GripVertical,
} from 'lucide-react';
import {
  useAdminStories,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  useAddSlide,
  useDeleteSlide,
} from '@/hooks/use-stories';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageUploader } from '@/components/admin/image-uploader';
import { cn } from '@/lib/utils';
import type { Story, StorySlide } from '@ecommerce/types';

// ── Story form ────────────────────────────────────────────────────────────────

interface StoryForm {
  title: string;
  coverImage: string;
  subtitle: string;
  isActive: boolean;
  position: string;
  scheduledAt: string;
  expiresAt: string;
}

const emptyForm = (): StoryForm => ({
  title: '',
  coverImage: '',
  subtitle: '',
  isActive: true,
  position: '0',
  scheduledAt: '',
  expiresAt: '',
});

function storyToForm(story: Story): StoryForm {
  return {
    title: story.title,
    coverImage: story.coverImage,
    subtitle: story.subtitle ?? '',
    isActive: story.isActive,
    position: String(story.position),
    scheduledAt: story.scheduledAt ? story.scheduledAt.slice(0, 16) : '',
    expiresAt: story.expiresAt ? story.expiresAt.slice(0, 16) : '',
  };
}

// ── Slide form ────────────────────────────────────────────────────────────────

interface SlideForm {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  duration: string;
  caption: string;
  productId: string;
  position: string;
}

const emptySlideForm = (): SlideForm => ({
  mediaUrl: '',
  mediaType: 'IMAGE',
  duration: '5',
  caption: '',
  productId: '',
  position: '0',
});

// ── Story row ─────────────────────────────────────────────────────────────────

function StoryRow({
  story,
  onEdit,
  onDelete,
  onToggle,
}: {
  story: Story;
  onEdit: (s: Story) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [slidesOpen, setSlidesOpen] = useState(false);
  const addSlide = useAddSlide();
  const deleteSlide = useDeleteSlide();
  const [slideForm, setSlideForm] = useState<SlideForm>(emptySlideForm);
  const [addingSlide, setAddingSlide] = useState(false);
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.products ?? [];

  async function handleAddSlide(e: React.FormEvent) {
    e.preventDefault();
    await addSlide.mutateAsync({
      storyId: story.id,
      mediaUrl: slideForm.mediaUrl,
      mediaType: slideForm.mediaType,
      duration: Number(slideForm.duration),
      caption: slideForm.caption || undefined,
      productId: slideForm.productId || undefined,
      position: Number(slideForm.position),
    });
    setSlideForm(emptySlideForm());
    setAddingSlide(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 p-4">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

        {/* Cover thumbnail */}
        <div className="relative h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-secondary">
          {story.coverImage ? (
            <Image src={story.coverImage} alt={story.title} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium leading-snug truncate">{story.title}</p>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                story.isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-500',
              )}
            >
              {story.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {story.subtitle && (
            <p className="text-xs text-muted-foreground truncate">{story.subtitle}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {story.slides.length} slide{story.slides.length !== 1 ? 's' : ''} · {story.viewCount} views · pos #{story.position}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggle(story.id, !story.isActive)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={story.isActive ? 'Deactivate' : 'Activate'}
          >
            {story.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onEdit(story)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(story.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setSlidesOpen((o) => !o)}
            className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Slides
            {slidesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Slides panel */}
      {slidesOpen && (
        <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
          {story.slides.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No slides yet.</p>
          )}

          {story.slides.map((slide: StorySlide, i: number) => (
            <div
              key={slide.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              {/* Thumbnail */}
              <div className="relative h-12 w-8 shrink-0 rounded-md overflow-hidden bg-secondary">
                {slide.mediaType === 'IMAGE' && slide.mediaUrl ? (
                  <Image src={slide.mediaUrl} alt={`Slide ${i + 1}`} fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-1.5">
                  {slide.mediaType === 'IMAGE' ? (
                    <ImageIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <Film className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-muted-foreground truncate">{slide.mediaUrl}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                  <span>{slide.duration}s</span>
                  {slide.caption && <span>· {slide.caption}</span>}
                  {slide.product && <span className="text-primary">· {slide.product.name}</span>}
                </div>
              </div>

              <button
                onClick={() => deleteSlide.mutate({ storyId: story.id, slideId: slide.id })}
                disabled={deleteSlide.isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add slide form */}
          {addingSlide ? (
            <form onSubmit={handleAddSlide} className="rounded-lg border border-dashed border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground mb-2">Add Slide</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={slideForm.mediaType}
                    onChange={(e) => setSlideForm((f) => ({ ...f, mediaType: e.target.value as 'IMAGE' | 'VIDEO', mediaUrl: '' }))}
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Duration (sec)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={slideForm.duration}
                    onChange={(e) => setSlideForm((f) => ({ ...f, duration: e.target.value }))}
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  {slideForm.mediaType === 'IMAGE' ? (
                    <>
                      <Label className="text-xs">Slide Image *</Label>
                      <div className="mt-1 max-w-[140px]">
                        <ImageUploader
                          value={slideForm.mediaUrl}
                          onChange={(url) => setSlideForm((f) => ({ ...f, mediaUrl: url }))}
                          folder="stories"
                          label="Upload"
                          aspect="portrait"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Label className="text-xs">Video URL *</Label>
                      <Input
                        required
                        value={slideForm.mediaUrl}
                        onChange={(e) => setSlideForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                        placeholder="https://cdn.example.com/clip.mp4"
                        className="mt-1 h-8 text-xs"
                      />
                    </>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Caption (optional)</Label>
                  <Input
                    value={slideForm.caption}
                    onChange={(e) => setSlideForm((f) => ({ ...f, caption: e.target.value }))}
                    placeholder="Short caption text"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Link Product (optional — shows a "Visit Now" button)</Label>
                  <select
                    value={slideForm.productId}
                    onChange={(e) => setSlideForm((f) => ({ ...f, productId: e.target.value }))}
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">— No product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={addSlide.isPending || !slideForm.mediaUrl} className="h-7 text-xs">
                  {addSlide.isPending ? 'Adding…' : 'Add Slide'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => { setAddingSlide(false); setSlideForm(emptySlideForm()); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingSlide(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Slide
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminStoriesPage() {
  const { data: stories = [], isLoading } = useAdminStories();
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Story | null>(null);
  const [form, setForm] = useState<StoryForm>(emptyForm());

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(story: Story) {
    setEditTarget(story);
    setForm(storyToForm(story));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      coverImage: form.coverImage,
      subtitle: form.subtitle || undefined,
      isActive: form.isActive,
      position: Number(form.position),
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };
    if (editTarget) {
      await updateStory.mutateAsync({ id: editTarget.id, ...payload });
    } else {
      await createStory.mutateAsync(payload);
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this story? All slides will also be deleted.')) return;
    await deleteStory.mutateAsync(id);
  }

  async function handleToggle(id: string, active: boolean) {
    await updateStory.mutateAsync({ id, isActive: active });
  }

  const isSaving = createStory.isPending || updateStory.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Product Stories</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage Instagram-style stories shown on the homepage carousel
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Story
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Stories', value: stories.length },
          { label: 'Active', value: stories.filter((s) => s.isActive).length },
          { label: 'Total Views', value: stories.reduce((a, s) => a + s.viewCount, 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Story list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Film className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium text-muted-foreground">No stories yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Create your first story to show on the homepage</p>
          <Button onClick={openCreate} className="mt-4 gap-1.5" size="sm">
            <Plus className="h-4 w-4" />
            Create Story
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Story' : 'New Story'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Summer Collection"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Cover Image *</Label>
              <div className="mt-1 max-w-[160px]">
                <ImageUploader
                  value={form.coverImage}
                  onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))}
                  folder="stories"
                  label="Upload Cover"
                  aspect="portrait"
                />
              </div>
            </div>

            <div>
              <Label>Subtitle (optional)</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Explore our latest arrivals"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Display Position</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-3 pb-px">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Schedule Start (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Story'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
