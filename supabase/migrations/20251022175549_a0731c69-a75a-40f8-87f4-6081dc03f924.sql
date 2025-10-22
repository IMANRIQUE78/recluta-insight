-- Agregar política para que los reclutadores puedan ver postulaciones a sus vacantes
CREATE POLICY "Los reclutadores pueden ver postulaciones a sus vacantes"
ON public.postulaciones
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    WHERE pm.id = postulaciones.publicacion_id
      AND v.user_id = auth.uid()
  )
);