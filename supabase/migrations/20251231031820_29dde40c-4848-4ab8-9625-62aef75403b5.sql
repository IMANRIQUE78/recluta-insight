-- Create waiting list table for platform launch
CREATE TABLE public.lista_espera_lanzamiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  perfil_interes TEXT NOT NULL CHECK (perfil_interes IN ('empresa', 'reclutador', 'candidato')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmado BOOLEAN DEFAULT false,
  ip_registro TEXT,
  fuente TEXT DEFAULT 'landing'
);

-- Enable RLS
ALTER TABLE public.lista_espera_lanzamiento ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for registration from landing page)
CREATE POLICY "Cualquiera puede registrarse en lista de espera"
ON public.lista_espera_lanzamiento
FOR INSERT
WITH CHECK (true);

-- Only admins can view the list
CREATE POLICY "Solo admins pueden ver lista de espera"
ON public.lista_espera_lanzamiento
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster email lookups
CREATE INDEX idx_lista_espera_email ON public.lista_espera_lanzamiento(email);
CREATE INDEX idx_lista_espera_perfil ON public.lista_espera_lanzamiento(perfil_interes);