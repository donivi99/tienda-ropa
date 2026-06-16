const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 3, baseDelayMs = 500 }: RetryOptions = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Error de red al subir imagen');
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetchWithRetry(UPLOAD_URL, { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error?.message || 'Error al subir imagen');
  return data.secure_url;
}

export function cloudinaryUrl(
  publicId: string,
  options?: { width?: number; height?: number; crop?: string; quality?: string }
): string {
  const { width, height, crop = 'fill', quality = 'auto' } = options || {};

  let transformations = `q_${quality}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (crop) transformations += `,c_${crop}`;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

export function optimizeImageUrl(url: string, width = 600): string {
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/q_auto,w_${width},c_limit/`);
}
