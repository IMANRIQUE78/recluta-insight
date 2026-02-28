-- Agregar política para que admin_empresa pueda ver perfiles de candidatos 
-- que se postularon a vacantes de su empresa
CREATE POLICY "Admin empresa puede ver perfiles de candidatos postulados"
ON public.perfil_candidato
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN user_roles ur ON ur.empresa_id = v.empresa_id AND ur.user_id = auth.uid()
    WHERE p.candidato_user_id = perfil_candidato.user_id
    AND ur.role = 'admin_empresa'::app_role
  )
);

-- Agregar política para reclutador asignado a la vacante 
-- (complementa has_role('reclutador') para casos donde no tiene el rol en user_roles)
CREATE POLICY "Reclutador asignado puede ver perfiles de candidatos postulados"
ON public.perfil_candidato
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.candidato_user_id = perfil_candidato.user_id
    AND pr.user_id = auth.uid()
  )
);