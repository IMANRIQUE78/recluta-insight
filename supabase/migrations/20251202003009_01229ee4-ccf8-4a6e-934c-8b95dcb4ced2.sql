-- Permitir que los reclutadores vean las suscripciones de empresas con las que colaboran
CREATE POLICY "Reclutadores pueden ver suscripción de empresas asociadas"
ON public.suscripcion_empresa
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM reclutador_empresa re
    JOIN perfil_reclutador pr ON re.reclutador_id = pr.id
    WHERE re.empresa_id = suscripcion_empresa.empresa_id
    AND re.estado = 'activa'
    AND pr.user_id = auth.uid()
  )
);