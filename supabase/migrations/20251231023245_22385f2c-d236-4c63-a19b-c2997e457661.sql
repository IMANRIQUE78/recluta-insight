-- Tabla para rastrear qué reclutadores han desbloqueado la identidad de qué candidatos
CREATE TABLE public.acceso_identidad_candidato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reclutador_id UUID NOT NULL REFERENCES public.perfil_reclutador(id) ON DELETE CASCADE,
  candidato_user_id UUID NOT NULL,
  creditos_consumidos INTEGER NOT NULL DEFAULT 2,
  fecha_desbloqueo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  empresa_id UUID REFERENCES public.empresas(id), -- Empresa desde la cual se pagó (si aplica)
  origen_pago TEXT NOT NULL DEFAULT 'reclutador', -- 'empresa' o 'reclutador'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reclutador_id, candidato_user_id) -- Un reclutador solo puede desbloquear una vez a cada candidato
);

-- Habilitar RLS
ALTER TABLE public.acceso_identidad_candidato ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Reclutadores pueden ver sus desbloqueos"
  ON public.acceso_identidad_candidato
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfil_reclutador pr
      WHERE pr.id = acceso_identidad_candidato.reclutador_id
      AND pr.user_id = auth.uid()
    )
  );

CREATE POLICY "Sistema puede insertar desbloqueos"
  ON public.acceso_identidad_candidato
  FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_acceso_identidad_reclutador ON public.acceso_identidad_candidato(reclutador_id);
CREATE INDEX idx_acceso_identidad_candidato ON public.acceso_identidad_candidato(candidato_user_id);