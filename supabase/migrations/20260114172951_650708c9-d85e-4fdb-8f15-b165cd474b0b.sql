-- =====================================================
-- FUNCIÓN SECURITY DEFINER: Verificar si el usuario es el reclutador asignado
-- Esta función evita problemas de recursión y simplifica las políticas RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_reclutador_asignado_de_postulacion(p_postulacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    JOIN vacantes v ON v.id = pm.vacante_id
    JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = p_postulacion_id
    AND pr.user_id = auth.uid()
  )
$$;

-- También verificar si es el publicador original o reclutador asignado
CREATE OR REPLACE FUNCTION public.puede_gestionar_postulacion(p_postulacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON pm.id = p.publicacion_id
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE p.id = p_postulacion_id
    AND (
      pm.user_id = auth.uid()  -- El publicador original
      OR pr.user_id = auth.uid()  -- El reclutador asignado
    )
  )
$$;

-- Función para verificar acceso a publicación
CREATE OR REPLACE FUNCTION public.puede_gestionar_postulacion_por_publicacion(p_publicacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM publicaciones_marketplace pm
    LEFT JOIN vacantes v ON v.id = pm.vacante_id
    LEFT JOIN perfil_reclutador pr ON pr.id = v.reclutador_asignado_id
    WHERE pm.id = p_publicacion_id
    AND (
      pm.user_id = auth.uid()  -- El publicador original
      OR pr.user_id = auth.uid()  -- El reclutador asignado
    )
  )
$$;

-- =====================================================
-- ACTUALIZAR POLÍTICAS PARA postulaciones
-- Eliminar políticas conflictivas y crear nuevas unificadas
-- =====================================================

-- Eliminar políticas existentes conflictivas
DROP POLICY IF EXISTS "Reclutadores pueden ver postulaciones de sus publicaciones" ON postulaciones;
DROP POLICY IF EXISTS "Reclutadores pueden actualizar postulaciones de sus publicacion" ON postulaciones;
DROP POLICY IF EXISTS "Reclutadores asignados pueden ver postulaciones" ON postulaciones;
DROP POLICY IF EXISTS "Reclutadores asignados pueden actualizar postulaciones" ON postulaciones;

-- Crear políticas unificadas usando la función
CREATE POLICY "Gestores pueden ver postulaciones"
ON postulaciones
FOR SELECT
TO authenticated
USING (
  auth.uid() = candidato_user_id  -- El candidato ve sus propias postulaciones
  OR puede_gestionar_postulacion_por_publicacion(publicacion_id)  -- Publicador o reclutador asignado
);

CREATE POLICY "Gestores pueden actualizar postulaciones"
ON postulaciones
FOR UPDATE
TO authenticated
USING (puede_gestionar_postulacion_por_publicacion(publicacion_id))
WITH CHECK (puede_gestionar_postulacion_por_publicacion(publicacion_id));

-- =====================================================
-- ACTUALIZAR POLÍTICAS PARA entrevistas_candidato
-- =====================================================

DROP POLICY IF EXISTS "Los reclutadores pueden ver entrevistas de sus vacantes" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Los reclutadores pueden crear entrevistas para sus vacantes" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Los reclutadores pueden actualizar entrevistas de sus vacantes" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Reclutadores asignados pueden ver entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Reclutadores asignados pueden crear entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Reclutadores asignados pueden actualizar entrevistas" ON entrevistas_candidato;

-- Políticas unificadas para entrevistas
CREATE POLICY "Gestores pueden ver entrevistas"
ON entrevistas_candidato
FOR SELECT
TO authenticated
USING (
  auth.uid() = candidato_user_id  -- El candidato ve sus propias entrevistas
  OR puede_gestionar_postulacion(postulacion_id)  -- Publicador o reclutador asignado
);

CREATE POLICY "Gestores pueden crear entrevistas"
ON entrevistas_candidato
FOR INSERT
TO authenticated
WITH CHECK (puede_gestionar_postulacion(postulacion_id));

CREATE POLICY "Gestores pueden actualizar entrevistas"
ON entrevistas_candidato
FOR UPDATE
TO authenticated
USING (
  auth.uid() = candidato_user_id  -- El candidato puede actualizar sus respuestas
  OR puede_gestionar_postulacion(postulacion_id)  -- Publicador o reclutador asignado
);

-- =====================================================
-- ACTUALIZAR POLÍTICAS PARA mensajes_postulacion
-- =====================================================

DROP POLICY IF EXISTS "Reclutadores asignados pueden enviar mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Reclutadores asignados pueden ver mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Usuarios pueden ver sus mensajes" ON mensajes_postulacion;
DROP POLICY IF EXISTS "Usuarios pueden marcar mensajes como leídos" ON mensajes_postulacion;

-- Políticas unificadas para mensajes
CREATE POLICY "Usuarios pueden ver mensajes de postulaciones"
ON mensajes_postulacion
FOR SELECT
TO authenticated
USING (
  auth.uid() = remitente_user_id  -- El remitente
  OR auth.uid() = destinatario_user_id  -- El destinatario
  OR puede_gestionar_postulacion(postulacion_id)  -- Publicador o reclutador asignado
);

CREATE POLICY "Usuarios pueden enviar mensajes"
ON mensajes_postulacion
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = remitente_user_id  -- Solo puede enviar como sí mismo
  AND (
    -- Es candidato de la postulación
    EXISTS (
      SELECT 1 FROM postulaciones p 
      WHERE p.id = postulacion_id 
      AND p.candidato_user_id = auth.uid()
    )
    -- O es gestor de la postulación
    OR puede_gestionar_postulacion(postulacion_id)
  )
);

CREATE POLICY "Usuarios pueden marcar mensajes como leídos"
ON mensajes_postulacion
FOR UPDATE
TO authenticated
USING (auth.uid() = destinatario_user_id)
WITH CHECK (auth.uid() = destinatario_user_id);

-- =====================================================
-- ELIMINAR POLÍTICAS REDUNDANTES (candidatos ya tienen políticas específicas)
-- =====================================================

DROP POLICY IF EXISTS "Candidatos pueden ver sus propias postulaciones" ON postulaciones;
DROP POLICY IF EXISTS "Los candidatos pueden ver sus propias entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Los candidatos pueden insertar sus propias entrevistas" ON entrevistas_candidato;
DROP POLICY IF EXISTS "Los candidatos pueden actualizar sus propias entrevistas" ON entrevistas_candidato;