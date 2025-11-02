-- Arreglar políticas RLS de invitaciones_reclutador
-- para permitir que empresas creen invitaciones

-- Eliminar política restrictiva anterior si existe
DROP POLICY IF EXISTS "Admin empresa puede gestionar invitaciones" ON invitaciones_reclutador;

-- Política para que empresas (usuarios que crearon empresas) puedan crear invitaciones
CREATE POLICY "Empresas pueden crear invitaciones"
ON invitaciones_reclutador
FOR INSERT
TO authenticated
WITH CHECK (
  -- La empresa_id debe pertenecer al usuario actual (quien creó la empresa)
  EXISTS (
    SELECT 1 FROM empresas
    WHERE empresas.id = invitaciones_reclutador.empresa_id
    AND empresas.created_by = auth.uid()
  )
);

-- Política para que empresas puedan ver sus invitaciones
CREATE POLICY "Empresas pueden ver sus invitaciones"
ON invitaciones_reclutador
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empresas
    WHERE empresas.id = invitaciones_reclutador.empresa_id
    AND empresas.created_by = auth.uid()
  )
);

-- Política para que empresas puedan actualizar sus invitaciones
CREATE POLICY "Empresas pueden actualizar sus invitaciones"
ON invitaciones_reclutador
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empresas
    WHERE empresas.id = invitaciones_reclutador.empresa_id
    AND empresas.created_by = auth.uid()
  )
);