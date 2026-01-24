-- Agregar campos faltantes a personal_empresa para NOM-035
ALTER TABLE public.personal_empresa 
ADD COLUMN IF NOT EXISTS centro_trabajo TEXT,
ADD COLUMN IF NOT EXISTS tipo_jornada TEXT DEFAULT 'completa',
ADD COLUMN IF NOT EXISTS modalidad_contratacion TEXT DEFAULT 'indefinido';

-- Añadir constraint para tipo_jornada
ALTER TABLE public.personal_empresa 
ADD CONSTRAINT personal_empresa_tipo_jornada_check 
CHECK (tipo_jornada IS NULL OR tipo_jornada IN ('completa', 'parcial', 'nocturna', 'mixta'));

-- Añadir constraint para modalidad_contratacion  
ALTER TABLE public.personal_empresa 
ADD CONSTRAINT personal_empresa_modalidad_contratacion_check 
CHECK (modalidad_contratacion IS NULL OR modalidad_contratacion IN ('indefinido', 'temporal', 'obra_determinada', 'capacitacion'));

-- Agregar columna personal_id a trabajadores_nom035 para referenciar personal_empresa
ALTER TABLE public.trabajadores_nom035 
ADD COLUMN IF NOT EXISTS personal_id UUID REFERENCES public.personal_empresa(id) ON DELETE SET NULL;