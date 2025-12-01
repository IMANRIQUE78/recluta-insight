-- Arreglar la función global de ranking de reclutadores evitando ambigüedad en user_id
CREATE OR REPLACE FUNCTION public.get_reclutador_ranking()
RETURNS TABLE(
  user_id uuid,
  nombre_reclutador text,
  vacantes_cerradas integer,
  promedio_dias_cierre numeric,
  ranking_score numeric,
  posicion integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH stats AS (
    SELECT 
      pr.user_id AS user_id,
      pr.nombre_reclutador AS nombre_reclutador,
      COUNT(*) FILTER (
        WHERE v.estatus = 'cerrada' 
          AND v.fecha_cierre IS NOT NULL
      ) AS vacantes_cerradas,
      COALESCE(
        AVG(
          CASE 
            WHEN v.estatus = 'cerrada' 
             AND v.fecha_cierre IS NOT NULL 
             AND v.fecha_solicitud IS NOT NULL
            THEN (v.fecha_cierre::date - v.fecha_solicitud::date)
          END
        ),
        0
      ) AS promedio_dias_cierre
    FROM perfil_reclutador pr
    LEFT JOIN vacantes v
      ON v.reclutador_asignado_id = pr.id
    GROUP BY pr.user_id, pr.nombre_reclutador
  ), scored AS (
    SELECT
      stats.user_id,
      stats.nombre_reclutador,
      stats.vacantes_cerradas,
      stats.promedio_dias_cierre,
      CASE 
        WHEN stats.vacantes_cerradas > 0 THEN
          GREATEST(0, stats.vacantes_cerradas * 100 - COALESCE(stats.promedio_dias_cierre, 0) * 0.5)
        ELSE 0
      END AS ranking_score
    FROM stats
  ), ordered AS (
    SELECT
      scored.user_id,
      scored.nombre_reclutador,
      scored.vacantes_cerradas,
      scored.promedio_dias_cierre,
      scored.ranking_score,
      ROW_NUMBER() OVER (
        ORDER BY scored.ranking_score DESC, scored.vacantes_cerradas DESC, scored.promedio_dias_cierre ASC
      ) AS posicion
    FROM scored
  )
  SELECT 
    ordered.user_id,
    ordered.nombre_reclutador,
    ordered.vacantes_cerradas,
    ordered.promedio_dias_cierre,
    ordered.ranking_score,
    ordered.posicion
  FROM ordered;
$function$;