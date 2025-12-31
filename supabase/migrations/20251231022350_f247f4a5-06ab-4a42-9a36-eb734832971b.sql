-- Eliminar la función get_reclutador_ranking() ya que el frontend calcula rankings localmente
-- y la función expone datos sensibles sin autenticación
DROP FUNCTION IF EXISTS public.get_reclutador_ranking();