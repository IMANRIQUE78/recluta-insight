-- Crear tabla de auditoría para cambios de estado de vacantes
CREATE TABLE IF NOT EXISTS public.auditoria_vacantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  estatus_anterior TEXT,
  estatus_nuevo TEXT NOT NULL,
  fecha_cambio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.auditoria_vacantes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden ver auditorías de sus vacantes"
ON public.auditoria_vacantes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vacantes
  WHERE vacantes.id = auditoria_vacantes.vacante_id
  AND vacantes.user_id = auth.uid()
));

CREATE POLICY "Los usuarios pueden insertar auditorías de sus vacantes"
ON public.auditoria_vacantes
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vacantes
  WHERE vacantes.id = auditoria_vacantes.vacante_id
  AND vacantes.user_id = auth.uid()
));

-- Índice para mejorar performance
CREATE INDEX idx_auditoria_vacantes_vacante_id ON public.auditoria_vacantes(vacante_id);
CREATE INDEX idx_auditoria_vacantes_fecha_cambio ON public.auditoria_vacantes(fecha_cambio);