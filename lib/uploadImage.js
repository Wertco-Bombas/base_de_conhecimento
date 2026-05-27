import imageCompression from 'browser-image-compression';
import { supabase } from './supabaseClient';

export async function uploadImage(file) {

  if (!file) return null;

  // COMPRESSÃO
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1280,
    initialQuality: 0.7,
    useWebWorker: true,
    fileType: 'image/webp'
  });

  // NOME DO ARQUIVO
  const fileName =
    `${Date.now()}-${Math.random()}.webp`;

  // UPLOAD
  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, compressedFile, {
      contentType: 'image/webp'
    });

  if (error) {
    console.error(error);
    return null;
  }

  // URL
  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
