-- Tabla de auditoría para rate limiting de sourcing IA
CREATE TABLE public.sourcing_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vacante_id UUID NOT NULL,
  publicacion_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('dry_run', 'execution')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas eficientes de rate limiting
CREATE INDEX idx_sourcing_audit_user_date ON public.sourcing_audit(user_id, created_at DESC);
CREATE INDEX idx_sourcing_audit_vacancy_user ON public.sourcing_audit(vacante_id, user_id, created_at DESC);

-- RLS: Solo el sistema puede insertar/ver registros de auditoría
ALTER TABLE public.sourcing_audit ENABLE ROW LEVEL SECURITY;

-- Política para que el sistema pueda insertar (edge functions con service role)
CREATE POLICY "Sistema puede insertar auditoría"
ON public.sourcing_audit
FOR INSERT
WITH CHECK (true);

-- Política para que admins puedan ver auditoría
CREATE POLICY "Admins pueden ver auditoría"
ON public.sourcing_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentario de tabla
COMMENT ON TABLE public.sourcing_audit IS 'Auditoría de llamadas a sourcing IA para rate limiting y seguridad';