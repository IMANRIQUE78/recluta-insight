-- Eliminar la función anterior con error
DROP FUNCTION IF EXISTS public.recalcular_estadisticas_reclutador(UUID);

-- Crear función corregida para recalcular estadísticas
CREATE OR REPLACE FUNCTION public.recalcular_estadisticas_reclutador(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vacantes_cerradas INTEGER;
  v_promedio_dias NUMERIC;
  v_total_dias NUMERIC;
BEGIN
  -- Contar vacantes cerradas
  SELECT COUNT(*)
  INTO v_vacantes_cerradas
  FROM vacantes
  WHERE user_id = p_user_id
    AND estatus = 'cerrada'
    AND fecha_cierre IS NOT NULL;

  -- Calcular promedio de días usando DATE
  SELECT COALESCE(SUM(fecha_cierre::date - fecha_solicitud::date), 0)
  INTO v_total_dias
  FROM vacantes
  WHERE user_id = p_user_id
    AND estatus = 'cerrada'
    AND fecha_cierre IS NOT NULL
    AND fecha_solicitud IS NOT NULL;

  IF v_vacantes_cerradas > 0 THEN
    v_promedio_dias := ROUND(v_total_dias / v_vacantes_cerradas, 2);
  ELSE
    v_promedio_dias := 0;
  END IF;

  -- Insertar o actualizar estadísticas
  INSERT INTO estadisticas_reclutador (user_id, vacantes_cerradas, promedio_dias_cierre, ultima_actualizacion)
  VALUES (p_user_id, v_vacantes_cerradas, v_promedio_dias, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    vacantes_cerradas = EXCLUDED.vacantes_cerradas,
    promedio_dias_cierre = EXCLUDED.promedio_dias_cierre,
    ultima_actualizacion = EXCLUDED.ultima_actualizacion,
    updated_at = NOW();
END;
$$;