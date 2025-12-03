-- Tabla de trabajadores para evaluación NOM-035
CREATE TABLE public.trabajadores_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo_trabajador TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  puesto TEXT NOT NULL,
  area TEXT NOT NULL,
  centro_trabajo TEXT NOT NULL,
  antiguedad_meses INTEGER NOT NULL DEFAULT 0,
  tipo_jornada TEXT NOT NULL DEFAULT 'completa',
  modalidad_contratacion TEXT NOT NULL DEFAULT 'indefinido',
  acepto_aviso_privacidad BOOLEAN NOT NULL DEFAULT false,
  fecha_acepto_aviso TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, codigo_trabajador)
);

-- Tabla de evaluaciones NOM-035 (sesiones de cuestionario)
CREATE TABLE public.evaluaciones_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  trabajador_id UUID NOT NULL REFERENCES public.trabajadores_nom035(id) ON DELETE CASCADE,
  tipo_guia TEXT NOT NULL CHECK (tipo_guia IN ('guia_i', 'guia_iii')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  puntaje_total NUMERIC,
  nivel_riesgo TEXT CHECK (nivel_riesgo IN ('nulo', 'bajo', 'medio', 'alto', 'muy_alto')),
  requiere_accion BOOLEAN DEFAULT false,
  periodo_evaluacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de respuestas individuales
CREATE TABLE public.respuestas_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_nom035(id) ON DELETE CASCADE,
  numero_pregunta INTEGER NOT NULL,
  seccion TEXT NOT NULL,
  dimension TEXT,
  respuesta_valor INTEGER NOT NULL,
  respuesta_texto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de resultados por dimensión (para Guía III)
CREATE TABLE public.resultados_dimension_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones_nom035(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  categoria TEXT NOT NULL,
  puntaje NUMERIC NOT NULL,
  nivel_riesgo TEXT NOT NULL CHECK (nivel_riesgo IN ('nulo', 'bajo', 'medio', 'alto', 'muy_alto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de configuración de política de prevención (Guía IV)
CREATE TABLE public.politica_prevencion_nom035 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE UNIQUE,
  contenido_politica TEXT NOT NULL,
  responsables JSONB,
  fecha_publicacion TIMESTAMP WITH TIME ZONE,
  vigente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.trabajadores_nom035 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_nom035 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_nom035 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_dimension_nom035 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politica_prevencion_nom035 ENABLE ROW LEVEL SECURITY;

-- Políticas para trabajadores_nom035
CREATE POLICY "Admin empresa puede ver trabajadores de su empresa"
ON public.trabajadores_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = trabajadores_nom035.empresa_id
  )
);

CREATE POLICY "Admin empresa puede insertar trabajadores"
ON public.trabajadores_nom035
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = trabajadores_nom035.empresa_id
  )
);

CREATE POLICY "Admin empresa puede actualizar trabajadores"
ON public.trabajadores_nom035
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = trabajadores_nom035.empresa_id
  )
);

CREATE POLICY "Admin empresa puede eliminar trabajadores"
ON public.trabajadores_nom035
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = trabajadores_nom035.empresa_id
  )
);

-- Políticas para evaluaciones_nom035
CREATE POLICY "Admin empresa puede ver evaluaciones de su empresa"
ON public.evaluaciones_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = evaluaciones_nom035.empresa_id
  )
);

CREATE POLICY "Admin empresa puede gestionar evaluaciones"
ON public.evaluaciones_nom035
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = evaluaciones_nom035.empresa_id
  )
);

-- Políticas para respuestas_nom035
CREATE POLICY "Admin empresa puede ver respuestas"
ON public.respuestas_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM evaluaciones_nom035 e
    JOIN user_roles ur ON ur.empresa_id = e.empresa_id
    WHERE e.id = respuestas_nom035.evaluacion_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'
  )
);

CREATE POLICY "Admin empresa puede gestionar respuestas"
ON public.respuestas_nom035
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM evaluaciones_nom035 e
    JOIN user_roles ur ON ur.empresa_id = e.empresa_id
    WHERE e.id = respuestas_nom035.evaluacion_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'
  )
);

-- Políticas para resultados_dimension_nom035
CREATE POLICY "Admin empresa puede ver resultados"
ON public.resultados_dimension_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM evaluaciones_nom035 e
    JOIN user_roles ur ON ur.empresa_id = e.empresa_id
    WHERE e.id = resultados_dimension_nom035.evaluacion_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'
  )
);

CREATE POLICY "Admin empresa puede gestionar resultados"
ON public.resultados_dimension_nom035
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM evaluaciones_nom035 e
    JOIN user_roles ur ON ur.empresa_id = e.empresa_id
    WHERE e.id = resultados_dimension_nom035.evaluacion_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'
  )
);

-- Políticas para politica_prevencion_nom035
CREATE POLICY "Admin empresa puede ver su política"
ON public.politica_prevencion_nom035
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = politica_prevencion_nom035.empresa_id
  )
);

CREATE POLICY "Admin empresa puede gestionar su política"
ON public.politica_prevencion_nom035
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'
    AND user_roles.empresa_id = politica_prevencion_nom035.empresa_id
  )
);

-- Función para generar código único de trabajador
CREATE OR REPLACE FUNCTION public.generate_trabajador_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_trabajador IS NULL OR NEW.codigo_trabajador = '' THEN
    NEW.codigo_trabajador := generate_unique_code('TRB');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para generar código automático
CREATE TRIGGER generate_trabajador_codigo_trigger
BEFORE INSERT ON public.trabajadores_nom035
FOR EACH ROW
EXECUTE FUNCTION public.generate_trabajador_codigo();

-- Triggers para updated_at
CREATE TRIGGER update_trabajadores_nom035_updated_at
BEFORE UPDATE ON public.trabajadores_nom035
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_evaluaciones_nom035_updated_at
BEFORE UPDATE ON public.evaluaciones_nom035
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_politica_prevencion_nom035_updated_at
BEFORE UPDATE ON public.politica_prevencion_nom035
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();