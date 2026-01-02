-- Agregar nuevo tipo de acción para sourcing IA
ALTER TYPE tipo_accion_credito ADD VALUE IF NOT EXISTS 'sourcing_ia';

-- Crear tabla para almacenar resultados de sourcing IA
CREATE TABLE public.sourcing_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  publicacion_id UUID NOT NULL REFERENCES public.publicaciones_marketplace(id) ON DELETE CASCADE,
  candidato_user_id UUID NOT NULL,
  reclutador_ejecutor_id UUID REFERENCES public.perfil_reclutador(id),
  empresa_ejecutora_id UUID REFERENCES public.empresas(id),
  ejecutor_user_id UUID NOT NULL,
  
  -- Análisis IA
  score_match NUMERIC(5,2) NOT NULL DEFAULT 0,
  razon_match TEXT,
  habilidades_coincidentes JSONB DEFAULT '[]'::jsonb,
  experiencia_relevante JSONB DEFAULT '[]'::jsonb,
  
  -- Estado del contacto
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'interesado', 'no_interesado', 'postulado', 'descartado')),
  notas_contacto TEXT,
  fecha_contacto TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  creditos_consumidos INTEGER NOT NULL DEFAULT 50,
  lote_sourcing UUID NOT NULL, -- Agrupa los 10 candidatos de una ejecución
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_sourcing_ia_vacante ON public.sourcing_ia(vacante_id);
CREATE INDEX idx_sourcing_ia_publicacion ON public.sourcing_ia(publicacion_id);
CREATE INDEX idx_sourcing_ia_candidato ON public.sourcing_ia(candidato_user_id);
CREATE INDEX idx_sourcing_ia_lote ON public.sourcing_ia(lote_sourcing);
CREATE INDEX idx_sourcing_ia_estado ON public.sourcing_ia(estado);
CREATE INDEX idx_sourcing_ia_ejecutor ON public.sourcing_ia(ejecutor_user_id);

-- Habilitar RLS
ALTER TABLE public.sourcing_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- Reclutadores pueden ver sourcing de vacantes asignadas a ellos
CREATE POLICY "Reclutadores ven sourcing de sus vacantes asignadas"
ON public.sourcing_ia
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vacantes v
    JOIN perfil_reclutador pr ON v.reclutador_asignado_id = pr.id
    WHERE v.id = sourcing_ia.vacante_id
    AND pr.user_id = auth.uid()
  )
);

-- Empresas pueden ver sourcing de sus vacantes
CREATE POLICY "Empresas ven sourcing de sus vacantes"
ON public.sourcing_ia
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vacantes v
    WHERE v.id = sourcing_ia.vacante_id
    AND v.user_id = auth.uid()
  )
);

-- Reclutadores pueden insertar sourcing para vacantes asignadas
CREATE POLICY "Reclutadores pueden insertar sourcing"
ON public.sourcing_ia
FOR INSERT
WITH CHECK (
  auth.uid() = ejecutor_user_id AND
  EXISTS (
    SELECT 1 FROM vacantes v
    JOIN perfil_reclutador pr ON v.reclutador_asignado_id = pr.id
    WHERE v.id = sourcing_ia.vacante_id
    AND pr.user_id = auth.uid()
  )
);

-- Empresas pueden insertar sourcing para sus vacantes
CREATE POLICY "Empresas pueden insertar sourcing"
ON public.sourcing_ia
FOR INSERT
WITH CHECK (
  auth.uid() = ejecutor_user_id AND
  EXISTS (
    SELECT 1 FROM vacantes v
    WHERE v.id = sourcing_ia.vacante_id
    AND v.user_id = auth.uid()
  )
);

-- Reclutadores pueden actualizar sourcing de sus vacantes
CREATE POLICY "Reclutadores pueden actualizar sourcing"
ON public.sourcing_ia
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vacantes v
    JOIN perfil_reclutador pr ON v.reclutador_asignado_id = pr.id
    WHERE v.id = sourcing_ia.vacante_id
    AND pr.user_id = auth.uid()
  )
);

-- Empresas pueden actualizar sourcing de sus vacantes
CREATE POLICY "Empresas pueden actualizar sourcing"
ON public.sourcing_ia
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vacantes v
    WHERE v.id = sourcing_ia.vacante_id
    AND v.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_sourcing_ia_updated_at
BEFORE UPDATE ON public.sourcing_ia
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();