-- Permitir a usuarios autenticados insertar sus propios roles durante onboarding
CREATE POLICY "Los usuarios pueden insertar sus propios roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios autenticados insertar roles asociados a empresas que crean
CREATE POLICY "Los usuarios pueden insertar roles de empresa al crearla"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('admin_empresa'::app_role, 'reclutador'::app_role, 'candidato'::app_role)
);