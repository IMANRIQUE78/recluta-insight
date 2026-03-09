
-- Fix: Add 'verificador' to allowed roles in INSERT policy
DROP POLICY IF EXISTS "Los usuarios pueden insertar roles de empresa al crearla" ON public.user_roles;
CREATE POLICY "Los usuarios pueden insertar sus roles al registrarse"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = ANY (ARRAY['admin_empresa'::app_role, 'reclutador'::app_role, 'candidato'::app_role, 'verificador'::app_role])
);

-- Fix: Allow users to delete their own orphan roles during onboarding cleanup
CREATE POLICY "Los usuarios pueden eliminar sus propios roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
