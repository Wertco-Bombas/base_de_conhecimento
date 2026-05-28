import { supabase } from './supabaseClient';

export async function uploadImage(file) {
  if (!file) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const img = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = reject;

      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const maxWidth = 1280;

  const scale = Math.min(maxWidth / img.width, 1);

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(
    img,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise(resolve => {
    canvas.toBlob(
      resolve,
      'image/jpeg',
      0.7
    );
  });

  const fileName =
    `${Date.now()}-${Math.random()}.jpg`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(fileName, blob, {
      contentType: 'image/jpeg'
    });

  if (error) {
    console.error('UPLOAD ERROR:', error);
    alert(error.message);
    return null;
  }

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  console.log('UPLOAD OK:', data.publicUrl);

  return data.publicUrl;
}
