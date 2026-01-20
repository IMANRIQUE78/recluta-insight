-- Tabla para conceptos de costeo de reclutamiento
CREATE TABLE public.conceptos_costeo_reclutamiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  costo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  periodicidad TEXT NOT NULL DEFAULT 'mensual' CHECK (periodicidad IN ('diario', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'unico')),
  unidad_medida TEXT NOT NULL DEFAULT 'pesos',
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_conceptos_costeo_updated_at
  BEFORE UPDATE ON public.conceptos_costeo_reclutamiento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.conceptos_costeo_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Solo usuarios de la empresa pueden ver/gestionar sus conceptos
CREATE POLICY "Usuarios empresa pueden ver sus conceptos de costeo"
  ON public.conceptos_costeo_reclutamiento
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = conceptos_costeo_reclutamiento.empresa_id
      AND ur.role IN ('admin_empresa', 'reclutador')
    )
  );

CREATE POLICY "Admin empresa puede insertar conceptos de costeo"
  ON public.conceptos_costeo_reclutamiento
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = conceptos_costeo_reclutamiento.empresa_id
      AND ur.role = 'admin_empresa'
    )
  );

CREATE POLICY "Admin empresa puede actualizar conceptos de costeo"
  ON public.conceptos_costeo_reclutamiento
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = conceptos_costeo_reclutamiento.empresa_id
      AND ur.role = 'admin_empresa'
    )
  );

CREATE POLICY "Admin empresa puede eliminar conceptos de costeo"
  ON public.conceptos_costeo_reclutamiento
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = conceptos_costeo_reclutamiento.empresa_id
      AND ur.role = 'admin_empresa'
    )
  );

-- Índice para mejorar consultas
CREATE INDEX idx_conceptos_costeo_empresa ON public.conceptos_costeo_reclutamiento(empresa_id);
CREATE INDEX idx_conceptos_costeo_activo ON public.conceptos_costeo_reclutamiento(empresa_id, activo);