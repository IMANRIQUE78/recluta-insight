-- Agregar política para que reclutadores vinculados puedan ver la wallet de empresas asociadas
CREATE POLICY "Reclutador vinculado puede ver wallet de empresa"
ON wallet_empresa
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM reclutador_empresa re
    JOIN perfil_reclutador pr ON pr.id = re.reclutador_id
    WHERE re.empresa_id = wallet_empresa.empresa_id
    AND pr.user_id = auth.uid()
    AND re.es_asociacion_activa = true
  )
);