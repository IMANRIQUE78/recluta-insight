-- Agregar nuevos campos a la tabla vacantes
ALTER TABLE public.vacantes 
ADD COLUMN IF NOT EXISTS a_quien_sustituye text,
ADD COLUMN IF NOT EXISTS perfil_requerido text;

-- Actualizar el enum motivo para asegurar que tenga todas las opciones
DO $$ 
BEGIN
  -- Solo intentar agregar si no existen
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'baja_personal' AND enumtypid = 'motivo_vacante'::regtype) THEN
    ALTER TYPE motivo_vacante ADD VALUE 'baja_personal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'incapacidad' AND enumtypid = 'motivo_vacante'::regtype) THEN
    ALTER TYPE motivo_vacante ADD VALUE 'incapacidad';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'crecimiento_negocio' AND enumtypid = 'motivo_vacante'::regtype) THEN
    ALTER TYPE motivo_vacante ADD VALUE 'crecimiento_negocio';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'nuevo_puesto' AND enumtypid = 'motivo_vacante'::regtype) THEN
    ALTER TYPE motivo_vacante ADD VALUE 'nuevo_puesto';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignorar si ya existen
END $$;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.vacantes.a_quien_sustituye IS 'Campo condicional: se llena solo si motivo es baja_personal o incapacidad';
COMMENT ON COLUMN public.vacantes.perfil_requerido IS 'Resumen del perfil requerido para la vacante';
COMMENT ON COLUMN public.vacantes.fecha_cierre IS 'Timestamp condicional: se llena cuando estatus es cerrada o cancelada';