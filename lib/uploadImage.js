import { supabase } from './supabaseClient';

export async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file);

  if (error) return null;

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
