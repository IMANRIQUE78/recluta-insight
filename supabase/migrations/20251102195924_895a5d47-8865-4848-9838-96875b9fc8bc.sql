-- Arreglar políticas RLS de reclutador_empresa para permitir que reclutadores
-- creen asociaciones cuando aceptan invitaciones

-- Política para que reclutadores puedan crear asociaciones cuando aceptan invitaciones
CREATE POLICY "Reclutadores pueden crear asociaciones al aceptar invitaciones"
ON reclutador_empresa
FOR INSERT
TO authenticated
WITH CHECK (
  -- El reclutador_id debe pertenecer al usuario actual
  EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = reclutador_empresa.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);