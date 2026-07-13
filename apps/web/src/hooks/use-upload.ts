import { useState } from 'react';
import { api } from '@/lib/api';

type UploadFolder = 'products' | 'stories' | 'blog' | 'brands' | 'banners' | 'avatars' | 'categories' | 'combos';

interface UploadResult {
  publicUrl: string;
  key: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(file: File, folder: UploadFolder = 'products'): Promise<UploadResult> {
    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Get pre-signed URL from our API
      const { data: presignData } = await api.post('/media/presign', {
        filename: file.name,
        contentType: file.type,
        folder,
      });
      const { uploadUrl, publicUrl, key } = presignData.data;

      // 2. Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.statusText}`));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setProgress(100);
      return { publicUrl, key };
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading, progress };
}
