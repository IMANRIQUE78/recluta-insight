-- ============================================
-- PARTE 2: TABLAS Y CONFIGURACIÓN
-- ============================================

-- TABLA EMPRESAS
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL,
  razon_social TEXT,
  rfc TEXT,
  sector TEXT,
  tamano_empresa TEXT CHECK (tamano_empresa IN ('startup', 'pyme', 'mediana', 'grande', 'corporativo')),
  pais TEXT DEFAULT 'México',
  sitio_web TEXT,
  descripcion_empresa TEXT,
  email_contacto TEXT NOT NULL,
  telefono_contacto TEXT,
  direccion_fiscal TEXT,
  ciudad TEXT,
  estado TEXT,
  codigo_postal TEXT,
  codigo_empresa TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUSCRIPCION EMPRESA
CREATE TABLE public.suscripcion_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  plan plan_empresa NOT NULL DEFAULT 'basico',
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  publicaciones_mes INTEGER DEFAULT 0,
  publicaciones_usadas INTEGER DEFAULT 0,
  acceso_marketplace BOOLEAN DEFAULT false,
  acceso_analytics_avanzado BOOLEAN DEFAULT false,
  soporte_prioritario BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- PERFIL RECLUTADOR
CREATE TABLE public.perfil_reclutador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_reclutador TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  tipo_reclutador tipo_reclutador NOT NULL DEFAULT 'interno',
  descripcion_reclutador TEXT,
  anos_experiencia INTEGER DEFAULT 0,
  especialidades TEXT[],
  codigo_reclutador TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUSCRIPCION RECLUTADOR
CREATE TABLE public.suscripcion_reclutador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reclutador_id UUID NOT NULL REFERENCES public.perfil_reclutador(id) ON DELETE CASCADE,
  plan plan_reclutador NOT NULL DEFAULT 'basico',
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  max_asociaciones_simultaneas INTEGER DEFAULT 1,
  acceso_pool_premium BOOLEAN DEFAULT false,
  acceso_baterias_psicometricas BOOLEAN DEFAULT false,
  acceso_ia_sourcing BOOLEAN DEFAULT false,
  publicacion_destacada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reclutador_id)
);

-- ASOCIACIONES RECLUTADOR-EMPRESA
CREATE TABLE public.reclutador_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reclutador_id UUID NOT NULL REFERENCES public.perfil_reclutador(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_vinculacion tipo_vinculacion NOT NULL,
  estado estado_asociacion NOT NULL DEFAULT 'activa',
  es_asociacion_activa BOOLEAN DEFAULT false,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reclutador_id, empresa_id)
);

-- INVITACIONES
CREATE TABLE public.invitaciones_reclutador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  reclutador_id UUID REFERENCES public.perfil_reclutador(id) ON DELETE CASCADE,
  codigo_reclutador TEXT NOT NULL,
  tipo_vinculacion tipo_vinculacion NOT NULL,
  estado estado_invitacion NOT NULL DEFAULT 'pendiente',
  mensaje TEXT,
  fecha_expiracion TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MODIFICAR VACANTES
ALTER TABLE public.vacantes 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.vacantes 
ADD COLUMN IF NOT EXISTS reclutador_asignado_id UUID REFERENCES public.perfil_reclutador(id);

-- ACTUALIZAR USER_ROLES
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER suscripcion_empresa_updated_at
  BEFORE UPDATE ON public.suscripcion_empresa
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER perfil_reclutador_updated_at
  BEFORE UPDATE ON public.perfil_reclutador
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER suscripcion_reclutador_updated_at
  BEFORE UPDATE ON public.suscripcion_reclutador
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reclutador_empresa_updated_at
  BEFORE UPDATE ON public.reclutador_empresa
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER invitaciones_reclutador_updated_at
  BEFORE UPDATE ON public.invitaciones_reclutador
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ÍNDICES
CREATE INDEX idx_empresas_codigo ON public.empresas(codigo_empresa);
CREATE INDEX idx_perfil_reclutador_codigo ON public.perfil_reclutador(codigo_reclutador);
CREATE INDEX idx_perfil_reclutador_user_id ON public.perfil_reclutador(user_id);
CREATE INDEX idx_reclutador_empresa_reclutador ON public.reclutador_empresa(reclutador_id);
CREATE INDEX idx_reclutador_empresa_empresa ON public.reclutador_empresa(empresa_id);
CREATE INDEX idx_reclutador_empresa_activa ON public.reclutador_empresa(reclutador_id, es_asociacion_activa) WHERE es_asociacion_activa = true;
CREATE INDEX idx_vacantes_empresa ON public.vacantes(empresa_id);
CREATE INDEX idx_vacantes_reclutador_asignado ON public.vacantes(reclutador_asignado_id);
CREATE INDEX idx_user_roles_user_empresa ON public.user_roles(user_id, empresa_id);