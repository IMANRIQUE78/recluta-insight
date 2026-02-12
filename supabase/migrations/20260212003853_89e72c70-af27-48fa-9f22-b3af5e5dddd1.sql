
-- Add flag for direct socioeconomic studies created by verificadores
ALTER TABLE public.estudios_socioeconomicos 
ADD COLUMN es_estudio_directo boolean NOT NULL DEFAULT false;

-- Add client/company name field for direct studies
ALTER TABLE public.estudios_socioeconomicos 
ADD COLUMN cliente_empresa text;

-- Add candidate contact info for direct studies (no auth user)
ALTER TABLE public.estudios_socioeconomicos 
ADD COLUMN telefono_candidato text;

-- Add email for direct candidates
ALTER TABLE public.estudios_socioeconomicos 
ADD COLUMN email_candidato text;
