-- Eliminar restricción única incorrecta en reclutador_id
-- Un reclutador debe poder tener múltiples vacantes asignadas
ALTER TABLE public.vacantes 
DROP CONSTRAINT IF EXISTS vacantes_reclutador_id_key;