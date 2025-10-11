-- Agregar campo de ubicación a publicaciones_marketplace
ALTER TABLE public.publicaciones_marketplace
ADD COLUMN ubicacion text;