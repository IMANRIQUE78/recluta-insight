-- 1. Primero limpiar las publicaciones de vacantes ya cerradas/canceladas
UPDATE publicaciones_marketplace pm
SET publicada = false, updated_at = now()
FROM vacantes v
WHERE pm.vacante_id = v.id
  AND v.estatus IN ('cerrada', 'cancelada')
  AND pm.publicada = true;

-- 2. Crear función que sincroniza el estado de publicación cuando cambia el estatus de la vacante
CREATE OR REPLACE FUNCTION public.sync_publicacion_on_vacante_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si la vacante se cierra o cancela, despublicar automáticamente
  IF NEW.estatus IN ('cerrada', 'cancelada') AND OLD.estatus = 'abierta' THEN
    UPDATE publicaciones_marketplace
    SET publicada = false, updated_at = now()
    WHERE vacante_id = NEW.id AND publicada = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Crear trigger que se ejecuta cuando cambia el estatus de una vacante
DROP TRIGGER IF EXISTS trigger_sync_publicacion_on_vacante_close ON vacantes;

CREATE TRIGGER trigger_sync_publicacion_on_vacante_close
  AFTER UPDATE OF estatus ON vacantes
  FOR EACH ROW
  WHEN (OLD.estatus IS DISTINCT FROM NEW.estatus)
  EXECUTE FUNCTION public.sync_publicacion_on_vacante_status_change();