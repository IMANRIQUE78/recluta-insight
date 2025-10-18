-- Agregar campos para información del reclutador en perfil_usuario
ALTER TABLE public.perfil_usuario
ADD COLUMN IF NOT EXISTS nombre_reclutador TEXT,
ADD COLUMN IF NOT EXISTS descripcion_reclutador TEXT;