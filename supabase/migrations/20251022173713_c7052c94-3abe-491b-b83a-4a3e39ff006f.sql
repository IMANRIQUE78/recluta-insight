-- Eliminar política pública de lectura de perfil_usuario
DROP POLICY IF EXISTS "Los perfiles son públicos para lectura" ON public.perfil_usuario;

-- Eliminar política pública de lectura de estadisticas_reclutador
DROP POLICY IF EXISTS "Las estadísticas son públicas para lectura" ON public.estadisticas_reclutador;

-- Los perfiles solo pueden ser vistos por el propio usuario y por reclutadores que tienen postulaciones
-- (la política existente "Los reclutadores pueden ver perfiles de candidatos que se postu" ya cubre esto)

-- Las estadísticas solo pueden ser vistas por el propio usuario
CREATE POLICY "Los usuarios pueden ver sus propias estadísticas"
ON public.estadisticas_reclutador
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);