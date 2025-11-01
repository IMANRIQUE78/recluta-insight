-- Agregar campos de redes sociales y configuración de privacidad al perfil del reclutador
ALTER TABLE perfil_reclutador
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS semblanza_profesional text,
ADD COLUMN IF NOT EXISTS mostrar_telefono boolean DEFAULT true;