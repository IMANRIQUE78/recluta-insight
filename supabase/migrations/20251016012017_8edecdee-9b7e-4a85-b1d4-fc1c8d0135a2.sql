-- Crear tabla de perfil de candidato
CREATE TABLE IF NOT EXISTS public.perfil_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nombre_completo text NOT NULL,
  email text NOT NULL,
  telefono text,
  ubicacion text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  
  -- Educación
  nivel_educacion text,
  carrera text,
  institucion text,
  
  -- Experiencia
  anos_experiencia integer DEFAULT 0,
  puesto_actual text,
  empresa_actual text,
  nivel_seniority text, -- junior, mid, senior, lead
  
  -- Habilidades y competencias
  habilidades_tecnicas text[], -- array de strings
  habilidades_blandas text[],
  idiomas jsonb, -- {idioma: nivel}
  
  -- Preferencias laborales
  salario_esperado_min numeric,
  salario_esperado_max numeric,
  modalidad_preferida text, -- remoto, presencial, hibrido
  disponibilidad text, -- inmediata, 2_semanas, 1_mes
  
  -- Resumen profesional
  resumen_profesional text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.perfil_candidato ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los candidatos pueden ver su propio perfil"
  ON public.perfil_candidato FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los candidatos pueden insertar su propio perfil"
  ON public.perfil_candidato FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los candidatos pueden actualizar su propio perfil"
  ON public.perfil_candidato FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los reclutadores pueden ver perfiles de candidatos que se postularon"
  ON public.perfil_candidato FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM postulaciones p
      INNER JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
      WHERE p.candidato_user_id = perfil_candidato.user_id
        AND pm.user_id = auth.uid()
    )
  );

-- Crear tabla de entrevistas
CREATE TABLE IF NOT EXISTS public.entrevistas_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_user_id uuid NOT NULL,
  postulacion_id uuid NOT NULL,
  fecha_entrevista timestamp with time zone NOT NULL,
  tipo_entrevista text, -- telefonica, presencial, virtual
  asistio boolean DEFAULT false,
  duracion_minutos integer,
  notas text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.entrevistas_candidato ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los candidatos pueden ver sus propias entrevistas"
  ON public.entrevistas_candidato FOR SELECT
  USING (auth.uid() = candidato_user_id);

CREATE POLICY "Los candidatos pueden insertar sus propias entrevistas"
  ON public.entrevistas_candidato FOR INSERT
  WITH CHECK (auth.uid() = candidato_user_id);

CREATE POLICY "Los candidatos pueden actualizar sus propias entrevistas"
  ON public.entrevistas_candidato FOR UPDATE
  USING (auth.uid() = candidato_user_id);

-- Crear tabla de feedback
CREATE TABLE IF NOT EXISTS public.feedback_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_user_id uuid NOT NULL,
  postulacion_id uuid NOT NULL,
  reclutador_user_id uuid NOT NULL,
  comentario text NOT NULL,
  puntuacion integer CHECK (puntuacion >= 1 AND puntuacion <= 5),
  aspectos_positivos text[],
  aspectos_mejora text[],
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.feedback_candidato ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los candidatos pueden ver su propio feedback"
  ON public.feedback_candidato FOR SELECT
  USING (auth.uid() = candidato_user_id);

CREATE POLICY "Los reclutadores pueden insertar feedback"
  ON public.feedback_candidato FOR INSERT
  WITH CHECK (auth.uid() = reclutador_user_id);

-- Actualizar tabla de postulaciones para agregar campos adicionales
ALTER TABLE public.postulaciones 
  ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS notas_reclutador text,
  ADD COLUMN IF NOT EXISTS etapa text DEFAULT 'recibida'; -- recibida, revision, entrevista, rechazada, contratada

-- Crear función para trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at
CREATE TRIGGER update_perfil_candidato_updated_at
  BEFORE UPDATE ON perfil_candidato
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entrevistas_candidato_updated_at
  BEFORE UPDATE ON entrevistas_candidato
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();