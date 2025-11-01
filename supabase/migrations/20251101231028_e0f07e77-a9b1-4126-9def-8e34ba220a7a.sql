-- Eliminar columnas nombre_reclutador y descripcion_reclutador de perfil_usuario
ALTER TABLE perfil_usuario 
DROP COLUMN IF EXISTS nombre_reclutador,
DROP COLUMN IF EXISTS descripcion_reclutador;