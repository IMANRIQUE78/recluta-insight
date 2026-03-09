
-- Fix suscripcion_empresa open INSERT
DROP POLICY IF EXISTS "Sistema puede insertar suscripción" ON public.suscripcion_empresa;
CREATE POLICY "Admin empresa puede crear suscripción"
ON public.suscripcion_empresa FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = suscripcion_empresa.empresa_id
  )
);
