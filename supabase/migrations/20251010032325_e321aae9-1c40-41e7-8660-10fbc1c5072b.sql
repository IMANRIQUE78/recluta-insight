-- Crear tabla para publicaciones públicas del marketplace
CREATE TABLE public.publicaciones_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Campos públicos seleccionables
  titulo_puesto TEXT NOT NULL,
  sueldo_bruto_aprobado NUMERIC,
  cliente_area TEXT,
  lugar_trabajo modalidad_trabajo NOT NULL,
  perfil_requerido TEXT,
  observaciones TEXT,
  
  -- Metadata
  publicada BOOLEAN NOT NULL DEFAULT true,
  fecha_publicacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(vacante_id)
);

-- Habilitar RLS
ALTER TABLE public.publicaciones_marketplace ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver publicaciones activas
CREATE POLICY "Publicaciones activas son públicas"
ON public.publicaciones_marketplace
FOR SELECT
USING (publicada = true);

-- Policy: Usuarios pueden crear publicaciones de sus vacantes
CREATE POLICY "Usuarios pueden publicar sus vacantes"
ON public.publicaciones_marketplace
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vacantes 
    WHERE id = vacante_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Usuarios pueden actualizar sus publicaciones
CREATE POLICY "Usuarios pueden actualizar sus publicaciones"
ON public.publicaciones_marketplace
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vacantes 
    WHERE id = vacante_id 
    AND user_id = auth.uid()
  )
);

-- Policy: Usuarios pueden eliminar sus publicaciones
CREATE POLICY "Usuarios pueden eliminar sus publicaciones"
ON public.publicaciones_marketplace
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM vacantes 
    WHERE id = vacante_id 
    AND user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_publicaciones_marketplace_updated_at
BEFORE UPDATE ON public.publicaciones_marketplace
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear tabla para postulaciones (preparada para futuro)
CREATE TABLE public.postulaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID NOT NULL REFERENCES public.publicaciones_marketplace(id) ON DELETE CASCADE,
  candidato_user_id UUID NOT NULL,
  
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_postulacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(publicacion_id, candidato_user_id)
);

-- Habilitar RLS
ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver sus propias postulaciones
CREATE POLICY "Usuarios pueden ver sus postulaciones"
ON public.postulaciones
FOR SELECT
USING (auth.uid() = candidato_user_id);

-- Policy: Usuarios autenticados pueden postularse
CREATE POLICY "Usuarios pueden postularse"
ON public.postulaciones
FOR INSERT
WITH CHECK (auth.uid() = candidato_user_id);

-- Crear índices
CREATE INDEX idx_publicaciones_marketplace_vacante ON public.publicaciones_marketplace(vacante_id);
CREATE INDEX idx_publicaciones_marketplace_publicada ON public.publicaciones_marketplace(publicada);
CREATE INDEX idx_postulaciones_publicacion ON public.postulaciones(publicacion_id);
CREATE INDEX idx_postulaciones_candidato ON public.postulaciones(candidato_user_id);