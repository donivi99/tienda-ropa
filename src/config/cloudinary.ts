const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
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
