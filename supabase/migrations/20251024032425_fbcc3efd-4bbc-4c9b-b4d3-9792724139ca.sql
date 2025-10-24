-- Permitir a los reclutadores actualizar las postulaciones de sus vacantes
CREATE POLICY "Los reclutadores pueden actualizar postulaciones a sus vacantes"
ON postulaciones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    WHERE pm.id = postulaciones.publicacion_id
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    WHERE pm.id = postulaciones.publicacion_id
    AND v.user_id = auth.uid()
  )
);