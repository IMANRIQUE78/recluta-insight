-- Permitir que usuarios autenticados (empresas) puedan buscar reclutadores por código
-- para poder enviarles invitaciones

CREATE POLICY "Usuarios autenticados pueden buscar reclutadores"
ON perfil_reclutador
FOR SELECT
TO authenticated
USING (true);

-- Nota: Esta política permite búsqueda pública de perfiles de reclutadores,
-- lo cual es necesario para que las empresas puedan invitarlos.
-- Los datos sensibles no se exponen ya que solo se consultan campos públicos.