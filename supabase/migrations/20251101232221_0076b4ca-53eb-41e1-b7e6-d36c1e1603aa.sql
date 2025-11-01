-- Agregar campos estructurados para experiencia laboral y educación al perfil del candidato
ALTER TABLE perfil_candidato
ADD COLUMN IF NOT EXISTS experiencia_laboral JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS educacion JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certificaciones JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN perfil_candidato.experiencia_laboral IS 'Array de objetos con: empresa, puesto, fecha_inicio, fecha_fin, descripcion, tags';
COMMENT ON COLUMN perfil_candidato.educacion IS 'Array de objetos con: institucion, titulo, fecha_inicio, fecha_fin, tipo (licenciatura/maestria/curso/diplomado)';
COMMENT ON COLUMN perfil_candidato.certificaciones IS 'Array de objetos con: nombre, institucion, fecha_obtencion';