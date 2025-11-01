-- ============================================
-- PARTE 1: CREAR ENUMS Y AGREGAR VALORES
-- ============================================

CREATE TYPE public.plan_empresa AS ENUM ('basico', 'profesional', 'enterprise');
CREATE TYPE public.tipo_reclutador AS ENUM ('interno', 'freelance');
CREATE TYPE public.plan_reclutador AS ENUM ('basico', 'profesional', 'premium');
CREATE TYPE public.tipo_vinculacion AS ENUM ('interno', 'freelance');
CREATE TYPE public.estado_asociacion AS ENUM ('activa', 'inactiva', 'finalizada');
CREATE TYPE public.estado_invitacion AS ENUM ('pendiente', 'aceptada', 'rechazada', 'expirada');

-- Agregar nuevos valores al enum app_role existente
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_empresa';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reclutador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'candidato';