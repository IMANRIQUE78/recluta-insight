-- ============================================================================
-- MIGRACIÓN MANUAL REQUERIDA: Actualizar algoritmo de ranking
-- ============================================================================
-- INSTRUCCIONES: Ejecuta este SQL en tu backend de Lovable Cloud
--                Settings → Cloud → Database → SQL Editor
--
-- CAMBIO: De algoritmo de resta a Índice de Productividad
--   ANTERIOR: Score = (Vacantes × 100) - (Días × 0.5)
--   NUEVO:    Score = (Vacantes / Días) × 100
-- ============================================================================

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
    -- Estadísticas base por reclutador
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
    -- ==================================================================
    -- NUEVO ALGORITMO: Índice de Productividad
    -- Fórmula: (Vacantes Cerradas / Promedio de Días) × 100
    -- ==================================================================
    -- INTERPRETACIÓN:
    --   • Mide vacantes cerradas por unidad de tiempo (productividad)
    --   • MÁS vacantes cerradas = MEJOR score
    --   • MENOS días promedio = MEJOR score
    --   • Score escalado ×100 para facilitar lectura
    -- ==================================================================
    SELECT
      stats.user_id,
      stats.nombre_reclutador,
      stats.vacantes_cerradas,
      stats.promedio_dias_cierre,
      CASE 
        -- Caso 1: Sin vacantes cerradas → Score = 0
        WHEN stats.vacantes_cerradas = 0 THEN 0
        
        -- Caso 2: Promedio = 0 o NULL (caso teórico: cierre instantáneo)
        --         Asignar score alto proporcional a las vacantes
        WHEN stats.promedio_dias_cierre = 0 OR stats.promedio_dias_cierre IS NULL THEN 
          stats.vacantes_cerradas * 10000
        
        -- Caso 3: Caso normal
        --         Productividad = (vacantes / días) × 100
        ELSE 
          ROUND((stats.vacantes_cerradas::numeric / stats.promedio_dias_cierre) * 100, 2)
      END AS ranking_score
    FROM stats
  ), ordered AS (
    -- Ordenamiento: Mayor score = Mejor posición
    -- Desempate por: 1) Más vacantes, 2) Menos días
    SELECT
      scored.user_id,
      scored.nombre_reclutador,
      scored.vacantes_cerradas,
      scored.promedio_dias_cierre,
      scored.ranking_score,
      ROW_NUMBER() OVER (
        ORDER BY scored.ranking_score DESC, 
                 scored.vacantes_cerradas DESC, 
                 scored.promedio_dias_cierre ASC
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

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esta query para verificar que el nuevo algoritmo funciona:
-- SELECT * FROM get_reclutador_ranking() LIMIT 10;
--
-- El score ahora debe mostrar valores como:
--   • 3 vacantes / 12 días = 25.00 (antes era ~293)
--   • 10 vacantes / 20 días = 50.00 (antes era ~990)
--   • 5 vacantes / 15 días = 33.33 (antes era ~492)
-- ============================================================================

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- CASOS EDGE:
--   1. Reclutador sin vacantes cerradas: Score = 0
--   2. Vacantes cerradas con promedio de 0 días (teórico): Score = vacantes × 10000
--   3. Promedio NULL: Tratado igual que 0
--
-- PUBLICACIÓN DE RESULTADOS:
--   Los resultados se publican mensualmente del periodo anterior
--   Ejemplo: En noviembre se visualizan datos de octubre
--
-- ESCALABILIDAD FUTURA:
--   El diseño permite agregar fácilmente:
--   • Metas de vacantes y días
--   • Ponderación configurable (volumen vs velocidad)
--   • Filtros por periodo de tiempo
-- ============================================================================
