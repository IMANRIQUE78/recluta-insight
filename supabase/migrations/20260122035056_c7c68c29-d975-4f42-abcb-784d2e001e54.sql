-- Agregar campos de código postal y supervisor a la tabla personal_empresa
ALTER TABLE public.personal_empresa
ADD COLUMN codigo_postal text NULL,
ADD COLUMN es_supervisor boolean NOT NULL DEFAULT false;