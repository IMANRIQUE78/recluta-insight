-- Crear tipos enumerados
CREATE TYPE public.app_role AS ENUM ('admin', 'rrhh', 'solo_lectura');
CREATE TYPE public.tipo_usuario AS ENUM ('dueno_direccion', 'profesional_rrhh');
CREATE TYPE public.tamano_empresa AS ENUM ('micro', 'pyme', 'mediana', 'grande');
CREATE TYPE public.estatus_vacante AS ENUM ('abierta', 'cerrada', 'cancelada');
CREATE TYPE public.motivo_vacante AS ENUM ('reposicion', 'crecimiento', 'temporal');
CREATE TYPE public.modalidad_trabajo AS ENUM ('hibrido', 'remoto', 'presencial');
CREATE TYPE public.senioridad AS ENUM ('junior', 'senior');
CREATE TYPE public.etapa_proceso AS ENUM ('sourcing', 'screening', 'entrevista_rrhh', 'entrevista_tecnica', 'validacion_cliente', 'oferta', 'onboarding');
CREATE TYPE public.fuente_candidato AS ENUM ('linkedin', 'referido', 'portal', 'base');

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función de seguridad para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Los usuarios pueden ver sus propios roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los admins pueden ver todos los roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabla de perfil de usuario
CREATE TABLE public.perfil_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_usuario tipo_usuario NOT NULL,
  sector TEXT,
  pais TEXT NOT NULL DEFAULT 'México',
  tamano_empresa tamano_empresa NOT NULL,
  vacantes_promedio_mes INT NOT NULL DEFAULT 0,
  miden_indicadores BOOLEAN NOT NULL DEFAULT false,
  horizonte_planeacion INT NOT NULL DEFAULT 6,
  metricas_clave TEXT[],
  frecuencia_actualizacion TEXT NOT NULL DEFAULT 'mensual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.perfil_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.perfil_usuario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
  ON public.perfil_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.perfil_usuario FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabla de clientes/áreas
CREATE TABLE public.clientes_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_nombre TEXT NOT NULL,
  area TEXT NOT NULL,
  ubicacion TEXT,
  tipo_cliente TEXT NOT NULL DEFAULT 'interno',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios clientes/áreas"
  ON public.clientes_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios clientes/áreas"
  ON public.clientes_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios clientes/áreas"
  ON public.clientes_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios clientes/áreas"
  ON public.clientes_areas FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de reclutadores
CREATE TABLE public.reclutadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  equipo TEXT,
  senioridad senioridad NOT NULL,
  costo_hora DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reclutadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios reclutadores"
  ON public.reclutadores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios reclutadores"
  ON public.reclutadores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios reclutadores"
  ON public.reclutadores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios reclutadores"
  ON public.reclutadores FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de vacantes
CREATE TABLE public.vacantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio TEXT NOT NULL,
  cliente_area_id UUID NOT NULL REFERENCES public.clientes_areas(id) ON DELETE CASCADE,
  titulo_puesto TEXT NOT NULL,
  senioridad senioridad NOT NULL,
  fecha_solicitud DATE NOT NULL,
  fecha_cierre DATE,
  estatus estatus_vacante NOT NULL DEFAULT 'abierta',
  motivo motivo_vacante NOT NULL,
  reclutador_id UUID REFERENCES public.reclutadores(id) ON DELETE SET NULL,
  lugar_trabajo modalidad_trabajo NOT NULL,
  sueldo_bruto_aprobado DECIMAL(10,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias vacantes"
  ON public.vacantes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias vacantes"
  ON public.vacantes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias vacantes"
  ON public.vacantes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias vacantes"
  ON public.vacantes FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de eventos del proceso
CREATE TABLE public.eventos_proceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  etapa etapa_proceso NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.eventos_proceso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver eventos de sus vacantes"
  ON public.eventos_proceso FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = eventos_proceso.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden insertar eventos de sus vacantes"
  ON public.eventos_proceso FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden actualizar eventos de sus vacantes"
  ON public.eventos_proceso FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = eventos_proceso.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

-- Tabla de candidatos
CREATE TABLE public.candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  fuente fuente_candidato NOT NULL,
  etapa_maxima etapa_proceso,
  contratado BOOLEAN NOT NULL DEFAULT false,
  fecha_ingreso DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver candidatos de sus vacantes"
  ON public.candidatos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = candidatos.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden insertar candidatos de sus vacantes"
  ON public.candidatos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden actualizar candidatos de sus vacantes"
  ON public.candidatos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = candidatos.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

-- Tabla de costos
CREATE TABLE public.costos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  tipo_costo TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.costos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver costos de sus vacantes"
  ON public.costos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = costos.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden insertar costos de sus vacantes"
  ON public.costos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

-- Tabla de rotación
CREATE TABLE public.rotacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  empleado_hash TEXT NOT NULL,
  fecha_ingreso DATE NOT NULL,
  fecha_baja DATE,
  motivo_baja TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rotacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver rotación de sus vacantes"
  ON public.rotacion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = rotacion.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden insertar rotación de sus vacantes"
  ON public.rotacion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

-- Tabla de satisfacción
CREATE TABLE public.satisfaccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacante_id UUID NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  nps INT,
  satisfaccion INT CHECK (satisfaccion >= 1 AND satisfaccion <= 5),
  comentarios TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.satisfaccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver satisfacción de sus vacantes"
  ON public.satisfaccion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = satisfaccion.vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

CREATE POLICY "Los usuarios pueden insertar satisfacción de sus vacantes"
  ON public.satisfaccion FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vacantes 
      WHERE vacantes.id = vacante_id 
      AND vacantes.user_id = auth.uid()
    )
  );

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_perfil_usuario_updated_at
  BEFORE UPDATE ON public.perfil_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_areas_updated_at
  BEFORE UPDATE ON public.clientes_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reclutadores_updated_at
  BEFORE UPDATE ON public.reclutadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacantes_updated_at
  BEFORE UPDATE ON public.vacantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_proceso_updated_at
  BEFORE UPDATE ON public.eventos_proceso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidatos_updated_at
  BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_costos_updated_at
  BEFORE UPDATE ON public.costos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rotacion_updated_at
  BEFORE UPDATE ON public.rotacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_satisfaccion_updated_at
  BEFORE UPDATE ON public.satisfaccion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();