-- Agregar campos de perfil de empresa y reclutador a perfil_usuario
ALTER TABLE public.perfil_usuario
ADD COLUMN nombre_usuario text,
ADD COLUMN nombre_empresa text,
ADD COLUMN mostrar_empresa_publica boolean NOT NULL DEFAULT true,
ADD COLUMN sitio_web text,
ADD COLUMN descripcion_empresa text;

-- Actualizar sectores con los 15 más representativos de LATAM
COMMENT ON COLUMN public.perfil_usuario.sector IS 'Sectores principales: Agroindustria, Tecnología, Manufactura, Servicios Financieros, Retail, Salud, Educación, Construcción, Energía, Minería, Turismo y Hospitalidad, Telecomunicaciones, Transporte y Logística, Bienes Raíces, Consultoría';