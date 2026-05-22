import { supabase } from './supabaseClient';

export async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file);

  if (error) return null;

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
