-- Permitir a reclutadores ver información básica de empresas asociadas
CREATE POLICY "Reclutadores pueden ver empresas con las que colaboran"
ON public.empresas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.reclutador_empresa re
    JOIN public.perfil_reclutador pr ON re.reclutador_id = pr.id
    WHERE re.empresa_id = empresas.id
    AND re.estado = 'activa'
    AND pr.user_id = auth.uid()
  )
);