-- Agregar campos para solicitud de cierre por parte del reclutador
ALTER TABLE public.vacantes
ADD COLUMN IF NOT EXISTS solicitud_cierre BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_solicitud_cierre TEXT,
ADD COLUMN IF NOT EXISTS fecha_solicitud_cierre TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentar el flujo
COMMENT ON COLUMN public.vacantes.solicitud_cierre IS 'Indica si el reclutador ha solicitado cerrar esta vacante';
COMMENT ON COLUMN public.vacantes.motivo_solicitud_cierre IS 'Motivo de la solicitud de cierre (candidato seleccionado, sin candidatos viables, etc.)';
COMMENT ON COLUMN public.vacantes.fecha_solicitud_cierre IS 'Fecha en que se solicitó el cierre';