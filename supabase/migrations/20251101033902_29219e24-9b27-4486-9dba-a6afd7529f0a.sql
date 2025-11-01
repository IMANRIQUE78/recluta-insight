-- Agregar campo created_by a empresas para rastrear quién creó la empresa
ALTER TABLE public.empresas 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Actualizar registros existentes (opcional, para datos ya existentes)
UPDATE public.empresas 
SET created_by = (
  SELECT user_id 
  FROM user_roles 
  WHERE user_roles.empresa_id = empresas.id 
    AND user_roles.role = 'admin_empresa'
  LIMIT 1
)
WHERE created_by IS NULL;

-- Crear política para que usuarios puedan ver empresas que crearon
CREATE POLICY "Los usuarios pueden ver empresas que crearon"
ON public.empresas
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);