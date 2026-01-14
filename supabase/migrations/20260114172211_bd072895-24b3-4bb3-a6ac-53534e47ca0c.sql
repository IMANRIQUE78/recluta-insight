-- =====================================================
-- POLÍTICA: Permitir a reclutadores asignados gestionar postulaciones
-- El problema es que publicaciones_marketplace.user_id puede ser diferente
-- al reclutador asignado (reclutador_asignado_id en vacantes)
-- =====================================================

-- Política SELECT para que reclutadores asignados puedan ver postulaciones
CREATE POLICY "Reclutadores asignados pueden ver postulaciones"
ON postulaciones
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND pr.user_id = auth.uid()
  )
);

-- Política UPDATE para que reclutadores asignados puedan actualizar postulaciones
CREATE POLICY "Reclutadores asignados pueden actualizar postulaciones"
ON postulaciones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND pr.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND pr.user_id = auth.uid()
  )
);

-- =====================================================
-- POLÍTICA: Entrevistas - Reclutadores asignados
-- =====================================================

-- SELECT para reclutadores asignados
CREATE POLICY "Reclutadores asignados pueden ver entrevistas"
ON entrevistas_candidato
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pr.user_id = auth.uid()
  )
);

-- INSERT para reclutadores asignados
CREATE POLICY "Reclutadores asignados pueden crear entrevistas"
ON entrevistas_candidato
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pr.user_id = auth.uid()
  )
);

-- UPDATE para reclutadores asignados
CREATE POLICY "Reclutadores asignados pueden actualizar entrevistas"
ON entrevistas_candidato
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pr.user_id = auth.uid()
  )
);

-- =====================================================
-- POLÍTICA: Mensajes - Reclutadores pueden enviar como remitentes
-- Necesitamos que el reclutador pueda enviar mensajes a candidatos
-- de postulaciones en vacantes asignadas
-- =====================================================

-- Política INSERT adicional para reclutadores asignados
CREATE POLICY "Reclutadores asignados pueden enviar mensajes"
ON mensajes_postulacion
FOR INSERT
WITH CHECK (
  auth.uid() = remitente_user_id
  AND EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = mensajes_postulacion.postulacion_id
    AND pr.user_id = auth.uid()
  )
);

-- SELECT para reclutadores asignados (ver mensajes de sus postulaciones)
CREATE POLICY "Reclutadores asignados pueden ver mensajes"
ON mensajes_postulacion
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = mensajes_postulacion.postulacion_id
    AND pr.user_id = auth.uid()
  )
);