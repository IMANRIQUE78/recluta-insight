-- Agregar campos de indexado IA al perfil de candidato
ALTER TABLE public.perfil_candidato
ADD COLUMN IF NOT EXISTS resumen_indexado_ia text,
ADD COLUMN IF NOT EXISTS keywords_sourcing text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS industrias_detectadas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS nivel_experiencia_ia text,
ADD COLUMN IF NOT EXISTS fecha_indexado_ia timestamp with time zone;

-- Crear índice GIN para búsqueda eficiente de keywords
CREATE INDEX IF NOT EXISTS idx_perfil_candidato_keywords_sourcing 
ON public.perfil_candidato USING GIN(keywords_sourcing);

-- Crear índice GIN para industrias
CREATE INDEX IF NOT EXISTS idx_perfil_candidato_industrias 
ON public.perfil_candidato USING GIN(industrias_detectadas);

-- Comentarios descriptivos
COMMENT ON COLUMN public.perfil_candidato.resumen_indexado_ia IS 'Resumen profesional optimizado y estructurado por IA para mejor matching';
COMMENT ON COLUMN public.perfil_candidato.keywords_sourcing IS 'Palabras clave extraídas por IA para sourcing rápido';
COMMENT ON COLUMN public.perfil_candidato.industrias_detectadas IS 'Industrias/sectores detectados automáticamente por IA';
COMMENT ON COLUMN public.perfil_candidato.nivel_experiencia_ia IS 'Nivel de experiencia inferido: junior, mid, senior, lead, executive';
COMMENT ON COLUMN public.perfil_candidato.fecha_indexado_ia IS 'Última fecha de indexado con IA';