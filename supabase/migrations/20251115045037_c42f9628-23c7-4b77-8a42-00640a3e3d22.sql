
-- Eliminar políticas existentes restrictivas de postulaciones para reclutadores
DROP POLICY IF EXISTS "Los reclutadores pueden ver postulaciones a sus vacantes" ON postulaciones;
DROP POLICY IF EXISTS "Los reclutadores pueden actualizar postulaciones a sus vacantes" ON postulaciones;

-- Crear nuevas políticas más permisivas para reclutadores
CREATE POLICY "Reclutadores pueden ver postulaciones de sus publicaciones"
ON postulaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM publicaciones_marketplace pm
    WHERE pm.id = postulaciones.publicacion_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Reclutadores pueden actualizar postulaciones de sus publicaciones"
ON postulaciones
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM publicaciones_marketplace pm
    WHERE pm.id = postulaciones.publicacion_id
    AND pm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM publicaciones_marketplace pm
    WHERE pm.id = postulaciones.publicacion_id
    AND pm.user_id = auth.uid()
  )
);

-- Asegurar que los candidatos puedan ver sus propias postulaciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus postulaciones" ON postulaciones;

CREATE POLICY "Candidatos pueden ver sus propias postulaciones"
ON postulaciones
FOR SELECT
TO authenticated
USING (auth.uid() = candidato_user_id);

-- Asegurar que los candidatos puedan crear postulaciones
DROP POLICY IF EXISTS "Usuarios pueden postularse" ON postulaciones;

CREATE POLICY "Candidatos pueden crear postulaciones"
ON postulaciones
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = candidato_user_id);
