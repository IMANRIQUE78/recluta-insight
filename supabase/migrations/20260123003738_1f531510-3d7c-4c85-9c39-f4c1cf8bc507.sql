-- Eliminar el constraint existente
ALTER TABLE public.conceptos_costeo_reclutamiento 
DROP CONSTRAINT IF EXISTS conceptos_costeo_reclutamiento_periodicidad_check;

-- Agregar nuevo constraint con todos los valores válidos incluyendo unico_X y hora
ALTER TABLE public.conceptos_costeo_reclutamiento 
ADD CONSTRAINT conceptos_costeo_reclutamiento_periodicidad_check 
CHECK (periodicidad = ANY (ARRAY[
  'hora'::text, 
  'diario'::text, 
  'semanal'::text, 
  'quincenal'::text, 
  'mensual'::text, 
  'bimestral'::text, 
  'trimestral'::text, 
  'semestral'::text, 
  'anual'::text, 
  'unico'::text,
  'unico_1'::text,
  'unico_3'::text,
  'unico_6'::text,
  'unico_12'::text,
  'unico_24'::text,
  'unico_36'::text
]));

-- Actualizar el default de unidad_medida a 'fijo' para consistencia
ALTER TABLE public.conceptos_costeo_reclutamiento 
ALTER COLUMN unidad_medida SET DEFAULT 'fijo';