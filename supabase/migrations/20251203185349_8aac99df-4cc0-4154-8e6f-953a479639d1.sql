-- Agregar campos de contacto a trabajadores_nom035
ALTER TABLE public.trabajadores_nom035 
ADD COLUMN email TEXT,
ADD COLUMN telefono TEXT,
ADD COLUMN fecha_ingreso DATE;

-- Crear tabla para tokens de acceso a cuestionarios
CREATE TABLE public.tokens_cuestionario_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trabajador_id UUID NOT NULL REFERENCES public.trabajadores_nom035(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_guia TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  usado BOOLEAN NOT NULL DEFAULT false,
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tokens_cuestionario_nom035 ENABLE ROW LEVEL SECURITY;

-- Política para que admins de empresa puedan crear tokens
CREATE POLICY "Admin empresa puede crear tokens"
ON public.tokens_cuestionario_nom035
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = tokens_cuestionario_nom035.empresa_id
  )
);

-- Política para que admins puedan ver tokens de su empresa
CREATE POLICY "Admin empresa puede ver tokens"
ON public.tokens_cuestionario_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = tokens_cuestionario_nom035.empresa_id
  )
);

-- Política pública para validar tokens (sin auth)
CREATE POLICY "Tokens pueden ser validados públicamente"
ON public.tokens_cuestionario_nom035
FOR SELECT
USING (true);

-- Política para marcar token como usado
CREATE POLICY "Tokens pueden ser actualizados al usar"
ON public.tokens_cuestionario_nom035
FOR UPDATE
USING (true)
WITH CHECK (true);