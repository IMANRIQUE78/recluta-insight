-- Función centralizada para calcular el ranking global de reclutadores
CREATE OR REPLACE FUNCTION public.get_reclutador_ranking()
RETURNS TABLE (
  user_id uuid,
  nombre_reclutador text,
  vacantes_cerradas integer,
  promedio_dias_cierre numeric,
  ranking_score numeric,
  posicion integer
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      pr.user_id,
      pr.nombre_reclutador,
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
      user_id,
      nombre_reclutador,
      vacantes_cerradas,
      promedio_dias_cierre,
      CASE 
        WHEN vacantes_cerradas > 0 THEN
          GREATEST(0, vacantes_cerradas * 100 - COALESCE(promedio_dias_cierre, 0) * 0.5)
        ELSE 0
      END AS ranking_score
    FROM stats
  ), ordered AS (
    SELECT
      user_id,
      nombre_reclutador,
      vacantes_cerradas,
      promedio_dias_cierre,
      ranking_score,
      ROW_NUMBER() OVER (
        ORDER BY ranking_score DESC, vacantes_cerradas DESC, promedio_dias_cierre ASC
      ) AS posicion
    FROM scored
  )
  SELECT 
    user_id,
    nombre_reclutador,
    vacantes_cerradas,
    promedio_dias_cierre,
    ranking_score,
    posicion
  FROM ordered;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public';