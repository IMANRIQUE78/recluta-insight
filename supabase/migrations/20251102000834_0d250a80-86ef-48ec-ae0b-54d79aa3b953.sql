-- Habilitar extensión de encriptación
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para encriptar datos sensibles
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Usar una clave de encriptación (en producción debe estar en secrets)
  encryption_key := current_setting('app.encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := gen_random_uuid()::text;
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(data, encryption_key),
    'base64'
  );
END;
$$;

-- Función para desencriptar datos sensibles
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  encryption_key := current_setting('app.encryption_key', true);
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := gen_random_uuid()::text;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Agregar columnas encriptadas para datos sensibles
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS rfc_encrypted text,
  ADD COLUMN IF NOT EXISTS razon_social_encrypted text,
  ADD COLUMN IF NOT EXISTS direccion_fiscal_encrypted text;

-- Trigger para encriptar datos antes de insertar
CREATE OR REPLACE FUNCTION public.encrypt_empresa_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encriptar RFC si existe
  IF NEW.rfc IS NOT NULL THEN
    NEW.rfc_encrypted := encrypt_sensitive_data(NEW.rfc);
    NEW.rfc := '***ENCRYPTED***';
  END IF;
  
  -- Encriptar razón social si existe
  IF NEW.razon_social IS NOT NULL THEN
    NEW.razon_social_encrypted := encrypt_sensitive_data(NEW.razon_social);
    NEW.razon_social := '***ENCRYPTED***';
  END IF;
  
  -- Encriptar dirección fiscal si existe
  IF NEW.direccion_fiscal IS NOT NULL THEN
    NEW.direccion_fiscal_encrypted := encrypt_sensitive_data(NEW.direccion_fiscal);
    NEW.direccion_fiscal := '***ENCRYPTED***';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para encriptación automática
DROP TRIGGER IF EXISTS encrypt_empresa_data_trigger ON public.empresas;
CREATE TRIGGER encrypt_empresa_data_trigger
  BEFORE INSERT OR UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_empresa_data();

-- Función para obtener datos desencriptados (solo para usuarios autorizados)
CREATE OR REPLACE FUNCTION public.get_empresa_decrypted(empresa_id uuid)
RETURNS TABLE (
  id uuid,
  nombre_empresa text,
  rfc_decrypted text,
  razon_social_decrypted text,
  direccion_fiscal_decrypted text,
  email_contacto text,
  telefono_contacto text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario es admin de plataforma o creador de la empresa
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = empresa_id
      AND (e.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.empresa_id = e.id
        AND ur.role = 'admin_empresa'::app_role
      ))
    )
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver datos sensibles de esta empresa';
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.nombre_empresa,
    decrypt_sensitive_data(e.rfc_encrypted) as rfc_decrypted,
    decrypt_sensitive_data(e.razon_social_encrypted) as razon_social_decrypted,
    decrypt_sensitive_data(e.direccion_fiscal_encrypted) as direccion_fiscal_decrypted,
    e.email_contacto,
    e.telefono_contacto
  FROM empresas e
  WHERE e.id = empresa_id;
END;
$$;

-- Actualizar política de inserción: solo admins de plataforma o usuarios verificados
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empresa" ON public.empresas;
CREATE POLICY "Solo usuarios verificados pueden crear empresa"
  ON public.empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND auth.jwt() ->> 'email_confirmed_at' IS NOT NULL
  );

-- Política más estricta para actualización
DROP POLICY IF EXISTS "Admin empresa puede actualizar su empresa" ON public.empresas;
CREATE POLICY "Solo admin empresa puede actualizar su empresa"
  ON public.empresas
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin_empresa'::app_role
      AND empresa_id = empresas.id
    )
  );

-- Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_empresas_created_by ON public.empresas(created_by);
CREATE INDEX IF NOT EXISTS idx_empresas_codigo ON public.empresas(codigo_empresa);

-- Log de auditoría para acceso a datos sensibles
CREATE TABLE IF NOT EXISTS public.auditoria_acceso_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  accion text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Habilitar RLS en tabla de auditoría
ALTER TABLE public.auditoria_acceso_empresas ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver auditoría
CREATE POLICY "Solo admins pueden ver auditoría de empresas"
  ON public.auditoria_acceso_empresas
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sistema puede insertar auditoría
CREATE POLICY "Sistema puede insertar auditoría"
  ON public.auditoria_acceso_empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);