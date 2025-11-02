-- Arreglar políticas RLS de empresas para permitir creación y actualización correcta

-- Eliminar política de UPDATE anterior
DROP POLICY IF EXISTS "Solo admin empresa puede actualizar su empresa" ON empresas;

-- Nueva política de UPDATE más flexible
CREATE POLICY "Usuario creador o admin empresa puede actualizar"
ON empresas
FOR UPDATE
USING (
  -- El usuario que creó la empresa puede actualizarla
  auth.uid() = created_by
  OR
  -- O es admin de plataforma
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- O tiene rol de admin_empresa para esta empresa específica
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = empresas.id
  )
);

-- Verificar política de INSERT para asegurar que funcione correctamente
DROP POLICY IF EXISTS "Solo usuarios verificados pueden crear empresa" ON empresas;

CREATE POLICY "Usuarios autenticados pueden crear empresa"
ON empresas
FOR INSERT
WITH CHECK (
  -- El usuario debe ser el creador
  auth.uid() = created_by
);