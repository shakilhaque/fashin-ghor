'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { useUpload } from '@/hooks/use-upload';
import { cn } from '@/lib/utils';

type UploadFolder = 'products' | 'stories' | 'blog' | 'brands' | 'banners' | 'avatars';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  label?: string;
  aspect?: 'square' | 'portrait' | 'landscape' | 'auto';
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = 'products',
  label = 'Upload Image',
  aspect = 'square',
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { upload, isUploading, progress } = useUpload();

  const aspectClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-video',
    auto: '',
  }[aspect];

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    try {
      const { publicUrl } = await upload(file, folder);
      onChange(publicUrl);
    } catch {
      alert('Upload failed. Check your S3 configuration.');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {value ? (
        <div className={cn('relative w-full overflow-hidden rounded-xl border border-border bg-secondary', aspectClass, aspect === 'auto' && 'min-h-[120px]')}>
          <Image src={value} alt="Uploaded" fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors',
            aspectClass,
            aspect === 'auto' && 'min-h-[120px] py-8',
            dragOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary',
            isUploading && 'cursor-not-allowed opacity-70',
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">{progress}%</p>
              <div className="absolute bottom-0 left-0 h-1 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP up to 10MB</p>
              </div>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Multi-image uploader for products
interface MultiImageUploaderProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: UploadFolder;
  maxImages?: number;
}

export function MultiImageUploader({ values, onChange, folder = 'products', maxImages = 8 }: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();

  async function handleFiles(files: FileList) {
    const remaining = maxImages - values.length;
    const toUpload = Array.from(files).slice(0, remaining);
    const results = await Promise.all(toUpload.map((f) => upload(f, folder)));
    onChange([...values, ...results.map((r) => r.publicUrl)]);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {values.map((url, i) => (
        <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
          <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" sizes="120px" />
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-3 w-3" />
          </button>
          {i === 0 && (
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-medium">
              Cover
            </span>
          )}
        </div>
      ))}

      {values.length < maxImages && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-[10px] font-medium">Add</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
