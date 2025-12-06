-- Add 'verificador' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verificador';

-- Create perfil_verificador table
CREATE TABLE public.perfil_verificador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  codigo_verificador TEXT NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  nombre_verificador TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  zona_cobertura TEXT[], -- Areas/zonas que cubre
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estudios_socioeconomicos table
CREATE TABLE public.estudios_socioeconomicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  
  -- Relaciones
  candidato_user_id UUID NOT NULL,
  postulacion_id UUID REFERENCES public.postulaciones(id),
  verificador_id UUID REFERENCES public.perfil_verificador(id),
  solicitante_user_id UUID NOT NULL, -- Reclutador que solicita
  empresa_id UUID REFERENCES public.empresas(id),
  
  -- Datos del candidato (copiados para referencia rápida)
  nombre_candidato TEXT NOT NULL,
  vacante_puesto TEXT NOT NULL,
  direccion_visita TEXT NOT NULL,
  
  -- Estatus y fechas
  estatus TEXT NOT NULL DEFAULT 'solicitado' CHECK (estatus IN ('solicitado', 'asignado', 'en_proceso', 'pendiente_carga', 'entregado', 'cancelado')),
  fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  fecha_limite TIMESTAMP WITH TIME ZONE NOT NULL, -- SLA
  fecha_visita DATE,
  hora_visita TIME,
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  
  -- Datos de la visita
  candidato_presente BOOLEAN,
  motivo_ausencia TEXT,
  observaciones_visita TEXT,
  
  -- Datos socioeconómicos (JSON para flexibilidad)
  datos_sociodemograficos JSONB DEFAULT '{}'::jsonb,
  datos_vivienda JSONB DEFAULT '{}'::jsonb,
  datos_economicos JSONB DEFAULT '{}'::jsonb,
  datos_laborales JSONB DEFAULT '{}'::jsonb,
  datos_referencias JSONB DEFAULT '{}'::jsonb,
  
  -- Resultado
  resultado_general TEXT, -- "Sin red flags", "Observaciones relevantes", etc.
  observaciones_finales TEXT,
  calificacion_riesgo TEXT CHECK (calificacion_riesgo IN ('bajo', 'medio', 'alto', 'muy_alto')),
  
  -- Evidencias (URLs de archivos)
  evidencias JSONB DEFAULT '[]'::jsonb,
  
  -- Estado del formulario
  borrador BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estadisticas_verificador table
CREATE TABLE public.estadisticas_verificador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  estudios_completados INTEGER DEFAULT 0,
  calificacion_promedio NUMERIC(3,2) DEFAULT 0,
  tiempo_respuesta_promedio_horas NUMERIC(10,2) DEFAULT 0,
  porcentaje_a_tiempo NUMERIC(5,2) DEFAULT 100,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calificaciones_estudio table for feedback
CREATE TABLE public.calificaciones_estudio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estudio_id UUID NOT NULL REFERENCES public.estudios_socioeconomicos(id),
  calificador_user_id UUID NOT NULL, -- Reclutador que califica
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate unique folio for estudios
CREATE OR REPLACE FUNCTION public.generate_estudio_folio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := generate_unique_code('ESE');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_estudio_folio_trigger
BEFORE INSERT ON public.estudios_socioeconomicos
FOR EACH ROW
EXECUTE FUNCTION public.generate_estudio_folio();

-- Generate unique codigo for verificador
CREATE OR REPLACE FUNCTION public.generate_verificador_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.codigo_verificador IS NULL OR NEW.codigo_verificador = '' OR length(NEW.codigo_verificador) < 10 THEN
    NEW.codigo_verificador := generate_unique_code('VER');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_verificador_codigo_trigger
BEFORE INSERT ON public.perfil_verificador
FOR EACH ROW
EXECUTE FUNCTION public.generate_verificador_codigo();

-- Enable RLS
ALTER TABLE public.perfil_verificador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudios_socioeconomicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas_verificador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones_estudio ENABLE ROW LEVEL SECURITY;

-- RLS Policies for perfil_verificador
CREATE POLICY "Verificadores pueden ver su propio perfil"
ON public.perfil_verificador FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Verificadores pueden actualizar su propio perfil"
ON public.perfil_verificador FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Verificadores pueden insertar su propio perfil"
ON public.perfil_verificador FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reclutadores pueden ver verificadores"
ON public.perfil_verificador FOR SELECT
USING (has_role(auth.uid(), 'reclutador'));

-- RLS Policies for estudios_socioeconomicos
CREATE POLICY "Verificadores pueden ver estudios asignados"
ON public.estudios_socioeconomicos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM perfil_verificador pv
    WHERE pv.id = estudios_socioeconomicos.verificador_id
    AND pv.user_id = auth.uid()
  )
);

CREATE POLICY "Verificadores pueden actualizar estudios asignados"
ON public.estudios_socioeconomicos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM perfil_verificador pv
    WHERE pv.id = estudios_socioeconomicos.verificador_id
    AND pv.user_id = auth.uid()
  )
);

CREATE POLICY "Reclutadores pueden ver sus estudios solicitados"
ON public.estudios_socioeconomicos FOR SELECT
USING (auth.uid() = solicitante_user_id);

CREATE POLICY "Reclutadores pueden crear estudios"
ON public.estudios_socioeconomicos FOR INSERT
WITH CHECK (auth.uid() = solicitante_user_id);

CREATE POLICY "Reclutadores pueden actualizar sus estudios"
ON public.estudios_socioeconomicos FOR UPDATE
USING (auth.uid() = solicitante_user_id);

-- RLS Policies for estadisticas_verificador
CREATE POLICY "Verificadores pueden ver sus estadísticas"
ON public.estadisticas_verificador FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Sistema puede gestionar estadísticas"
ON public.estadisticas_verificador FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for calificaciones_estudio
CREATE POLICY "Reclutadores pueden crear calificaciones"
ON public.calificaciones_estudio FOR INSERT
WITH CHECK (auth.uid() = calificador_user_id);

CREATE POLICY "Verificadores pueden ver calificaciones de sus estudios"
ON public.calificaciones_estudio FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM estudios_socioeconomicos ese
    JOIN perfil_verificador pv ON ese.verificador_id = pv.id
    WHERE ese.id = calificaciones_estudio.estudio_id
    AND pv.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_perfil_verificador_updated_at
BEFORE UPDATE ON public.perfil_verificador
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estudios_socioeconomicos_updated_at
BEFORE UPDATE ON public.estudios_socioeconomicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estadisticas_verificador_updated_at
BEFORE UPDATE ON public.estadisticas_verificador
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();