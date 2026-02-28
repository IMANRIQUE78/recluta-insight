-- Acceso robusto al perfil público de candidato sin depender de RLS de tablas intermedias
CREATE OR REPLACE FUNCTION public.puede_ver_perfil_candidato(p_candidato_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    auth.uid() = p_candidato_user_id
    OR public.has_role(auth.uid(), 'reclutador'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.postulaciones p
      JOIN public.publicaciones_marketplace pm ON pm.id = p.publicacion_id
      LEFT JOIN public.vacantes v ON v.id = pm.vacante_id
      LEFT JOIN public.perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
      LEFT JOIN public.user_roles ur
        ON ur.user_id = auth.uid()
       AND ur.empresa_id = v.empresa_id
       AND ur.role = 'admin_empresa'::app_role
      WHERE p.candidato_user_id = p_candidato_user_id
        AND (
          pm.user_id = auth.uid()
          OR pr.user_id = auth.uid()
          OR ur.user_id IS NOT NULL
        )
    )
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'perfil_candidato'
      AND policyname = 'Gestores autorizados pueden ver perfil candidato'
  ) THEN
    CREATE POLICY "Gestores autorizados pueden ver perfil candidato"
    ON public.perfil_candidato
    FOR SELECT
    USING (public.puede_ver_perfil_candidato(user_id));
  END IF;
END
$$;