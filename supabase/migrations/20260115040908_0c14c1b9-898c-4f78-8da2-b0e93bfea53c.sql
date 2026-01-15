
-- =====================================================
-- CORRECCIÓN INTEGRAL DE RLS - PARTE 2
-- Eliminar políticas duplicadas y crear las correctas
-- =====================================================

-- Primero limpiar políticas duplicadas
DROP POLICY IF EXISTS "Reclutadores pueden ver vacantes asignadas a ellos" ON vacantes;
DROP POLICY IF EXISTS "Gestores pueden ver publicaciones de sus vacantes" ON publicaciones_marketplace;
DROP POLICY IF EXISTS "Usuarios pueden ver postulaciones" ON postulaciones;
DROP POLICY IF EXISTS "Gestores pueden actualizar postulaciones" ON postulaciones;
DROP POLICY IF EXISTS "Usuarios pueden ver entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Gestores pueden crear entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Gestores pueden actualizar entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Usuarios pueden marcar mensajes como leídos" ON mensajes_postulacion;

-- Ahora limpiar las que creamos parcialmente
DROP POLICY IF EXISTS "Gestores pueden ver postulaciones" ON postulaciones;

-- 1. AGREGAR política SELECT para vacantes donde el reclutador está asignado
CREATE POLICY "Reclutadores pueden ver vacantes asignadas"
ON vacantes FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM perfil_reclutador pr
    WHERE pr.id = vacantes.reclutador_asignado_id
    AND pr.user_id = auth.uid()
  )
);

-- 2. AGREGAR política SELECT para publicaciones (independiente de si está publicada o no)
CREATE POLICY "Gestores pueden ver sus publicaciones"
ON publicaciones_marketplace FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM vacantes v
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE v.id = publicaciones_marketplace.vacante_id
    AND pr.user_id = auth.uid()
  )
);

-- 3. Políticas de postulaciones
CREATE POLICY "Usuarios ven postulaciones"
ON postulaciones FOR SELECT
TO authenticated
USING (
  candidato_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

CREATE POLICY "Gestores actualizan postulaciones"
ON postulaciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = postulaciones.publicacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

-- 4. Políticas de entrevistas_candidato
CREATE POLICY "Usuarios ven entrevistas"
ON entrevistas_candidato FOR SELECT
TO authenticated
USING (
  candidato_user_id = auth.uid()
  OR reclutador_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

CREATE POLICY "Gestores crean entrevistas"
ON entrevistas_candidato FOR INSERT
TO authenticated
WITH CHECK (
  reclutador_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

CREATE POLICY "Gestores actualizan entrevistas"
ON entrevistas_candidato FOR UPDATE
TO authenticated
USING (
  candidato_user_id = auth.uid()
  OR reclutador_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

-- 5. Políticas de mensajes_postulacion
CREATE POLICY "Usuarios ven mensajes"
ON mensajes_postulacion FOR SELECT
TO authenticated
USING (
  remitente_user_id = auth.uid()
  OR destinatario_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = mensajes_postulacion.postulacion_id
    AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
  )
);

CREATE POLICY "Usuarios envian mensajes"
ON mensajes_postulacion FOR INSERT
TO authenticated
WITH CHECK (
  remitente_user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM postulaciones p
      WHERE p.id = mensajes_postulacion.postulacion_id
      AND p.candidato_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM postulaciones p
      JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
      LEFT JOIN vacantes v ON v.id = pm.vacante_id
      LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
      WHERE p.id = mensajes_postulacion.postulacion_id
      AND (pm.user_id = auth.uid() OR pr.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Destinatarios marcan mensajes leidos"
ON mensajes_postulacion FOR UPDATE
TO authenticated
USING (destinatario_user_id = auth.uid())
WITH CHECK (destinatario_user_id = auth.uid());
