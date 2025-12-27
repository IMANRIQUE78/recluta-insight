-- Tabla para rastrear créditos heredados por empresa específica
CREATE TABLE public.creditos_heredados_reclutador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reclutador_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  creditos_disponibles INTEGER NOT NULL DEFAULT 0,
  creditos_totales_recibidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reclutador_id, empresa_id)
);

-- Comentario para claridad
COMMENT ON TABLE public.creditos_heredados_reclutador IS 'Créditos que un reclutador recibe de una empresa específica. Solo pueden usarse en vacantes de esa empresa.';
COMMENT ON COLUMN public.creditos_heredados_reclutador.creditos_disponibles IS 'Créditos heredados disponibles de esta empresa específica';
COMMENT ON COLUMN public.creditos_heredados_reclutador.creditos_totales_recibidos IS 'Total histórico de créditos recibidos de esta empresa';

-- Enable RLS
ALTER TABLE public.creditos_heredados_reclutador ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Reclutador puede ver sus créditos heredados"
ON public.creditos_heredados_reclutador
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfil_reclutador pr
    WHERE pr.id = creditos_heredados_reclutador.reclutador_id
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "Sistema puede insertar créditos heredados"
ON public.creditos_heredados_reclutador
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Sistema puede actualizar créditos heredados"
ON public.creditos_heredados_reclutador
FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_creditos_heredados_reclutador_updated_at
BEFORE UPDATE ON public.creditos_heredados_reclutador
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();