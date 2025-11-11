-- Permitir a reclutadores ver vacantes asignadas a ellos
CREATE POLICY "Reclutadores pueden ver vacantes asignadas a ellos"
ON public.vacantes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = vacantes.reclutador_asignado_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

-- Permitir a reclutadores actualizar vacantes asignadas a ellos
CREATE POLICY "Reclutadores pueden actualizar vacantes asignadas a ellos"
ON public.vacantes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = vacantes.reclutador_asignado_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

-- Permitir a reclutadores publicar en marketplace vacantes asignadas
CREATE POLICY "Reclutadores pueden publicar vacantes asignadas"
ON public.publicaciones_marketplace
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.vacantes v
    JOIN public.perfil_reclutador pr ON v.reclutador_asignado_id = pr.id
    WHERE v.id = publicaciones_marketplace.vacante_id
    AND pr.user_id = auth.uid()
  )
);

-- Permitir a reclutadores actualizar publicaciones de vacantes asignadas
CREATE POLICY "Reclutadores pueden actualizar publicaciones de vacantes asignadas"
ON public.publicaciones_marketplace
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.vacantes v
    JOIN public.perfil_reclutador pr ON v.reclutador_asignado_id = pr.id
    WHERE v.id = publicaciones_marketplace.vacante_id
    AND pr.user_id = auth.uid()
  )
);