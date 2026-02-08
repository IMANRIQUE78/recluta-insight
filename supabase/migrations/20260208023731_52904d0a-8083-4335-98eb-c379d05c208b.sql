-- Agregar columna para fecha de fin de contrato temporal
ALTER TABLE public.personal_empresa
ADD COLUMN fecha_fin_contrato date NULL;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN public.personal_empresa.fecha_fin_contrato IS 'Fecha de terminación del contrato, aplica cuando modalidad_contratacion es temporal u obra_determinada';