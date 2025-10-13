-- Crear vista materializada para estadísticas de reclutadores
-- Esta vista almacena las métricas calculadas de cada usuario

CREATE TABLE IF NOT EXISTS public.estadisticas_reclutador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  vacantes_cerradas INTEGER NOT NULL DEFAULT 0,
  promedio_dias_cierre NUMERIC NOT NULL DEFAULT 0,
  ranking_score NUMERIC,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.estadisticas_reclutador ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver las estadísticas (es un ranking público)
CREATE POLICY "Las estadísticas son públicas para lectura"
ON public.estadisticas_reclutador
FOR SELECT
USING (true);

-- Política para que los usuarios puedan actualizar sus propias estadísticas
CREATE POLICY "Los usuarios pueden actualizar sus propias estadísticas"
ON public.estadisticas_reclutador
FOR UPDATE
USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propias estadísticas
CREATE POLICY "Los usuarios pueden insertar sus propias estadísticas"
ON public.estadisticas_reclutador
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_estadisticas_reclutador_updated_at
BEFORE UPDATE ON public.estadisticas_reclutador
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para recalcular estadísticas de un usuario
CREATE OR REPLACE FUNCTION public.recalcular_estadisticas_reclutador(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vacantes_cerradas INTEGER;
  v_promedio_dias NUMERIC;
  v_total_dias INTEGER;
BEGIN
  -- Contar vacantes cerradas
  SELECT COUNT(*)
  INTO v_vacantes_cerradas
  FROM vacantes
  WHERE user_id = p_user_id
    AND estatus = 'cerrada'
    AND fecha_cierre IS NOT NULL;

  -- Calcular promedio de días
  SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (fecha_cierre - fecha_solicitud)) / 86400), 0)
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