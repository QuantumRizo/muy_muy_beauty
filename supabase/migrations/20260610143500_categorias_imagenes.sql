-- Actualiza las imágenes de las categorías con las URLs públicas de Supabase Storage

UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/esmaltado_permanente.webp' WHERE nombre = 'Esmaltado Permanente';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/unas_esculpidas.webp' WHERE nombre = 'Uñas Esculpidas';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/manicura.webp' WHERE nombre = 'Manicura & Spa';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/facial.webp' WHERE nombre = 'Cuidado Facial';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/masaje.webp' WHERE nombre = 'Masajes Terapéuticos';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/pedicura.webp' WHERE nombre = 'Pedicura Avanzada';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/eyes_beauty.webp' WHERE nombre = 'Eyes & Brows';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/depilacion.webp' WHERE nombre = 'Depilación Premium';
UPDATE public.categorias_servicio SET imagen_url = 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/nail_art.webp' WHERE nombre = 'Nail Art & Diseño';
