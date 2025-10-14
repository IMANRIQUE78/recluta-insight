-- Permitir que todos los usuarios vean los perfiles públicos (para el ranking global)
CREATE POLICY "Los perfiles son públicos para lectura"
ON public.perfil_usuario
FOR SELECT
USING (true);

-- Poblar estadísticas iniciales para todos los usuarios existentes
INSERT INTO estadisticas_reclutador (user_id, vacantes_cerradas, promedio_dias_cierre, ranking_score)
SELECT 
  p.user_id,
  COALESCE(
    (SELECT COUNT(*)
     FROM vacantes v
     WHERE v.user_id = p.user_id
       AND v.estatus = 'cerrada'
       AND v.fecha_cierre IS NOT NULL), 0
  ) as vacantes_cerradas,
  COALESCE(
    (SELECT ROUND(AVG(v.fecha_cierre::date - v.fecha_solicitud::date), 2)
     FROM vacantes v
     WHERE v.user_id = p.user_id
       AND v.estatus = 'cerrada'
       AND v.fecha_cierre IS NOT NULL
       AND v.fecha_solicitud IS NOT NULL), 0
  ) as promedio_dias_cierre,
  NULL as ranking_score
FROM perfil_usuario p
ON CONFLICT (user_id) 
DO UPDATE SET
  vacantes_cerradas = EXCLUDED.vacantes_cerradas,
  promedio_dias_cierre = EXCLUDED.promedio_dias_cierre,
  ultima_actualizacion = NOW(),
  updated_at = NOW();