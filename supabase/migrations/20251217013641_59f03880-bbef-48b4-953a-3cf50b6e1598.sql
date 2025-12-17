-- 1. Fix encryption functions to fail gracefully instead of using random keys
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- If data is null, return null
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get encryption key from config
  encryption_key := current_setting('app.encryption_key', true);
  
  -- CRITICAL: Fail if no key configured instead of using random key
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key before using encryption features.';
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(data, encryption_key),
    'base64'
  );
END;
$$;

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
  
  -- CRITICAL: Fail if no key configured
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Set app.encryption_key before using encryption features.';
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return placeholder for corrupted/unreadable data
    RETURN '[ENCRYPTED]';
END;
$$;

-- 2. Add encrypted columns to trabajadores_nom035
ALTER TABLE public.trabajadores_nom035 
ADD COLUMN IF NOT EXISTS email_encrypted text,
ADD COLUMN IF NOT EXISTS telefono_encrypted text;

-- 3. Create a safe encryption function that handles missing key gracefully
CREATE OR REPLACE FUNCTION public.safe_encrypt(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  encryption_key := current_setting('app.encryption_key', true);
  
  -- If no key, return data as-is (will be encrypted when key is configured)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(data, encryption_key),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.safe_decrypt(encrypted_data text, fallback_data text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- If no encrypted data, return fallback
  IF encrypted_data IS NULL THEN
    RETURN fallback_data;
  END IF;
  
  encryption_key := current_setting('app.encryption_key', true);
  
  -- If no key, return fallback
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RETURN fallback_data;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN fallback_data;
END;
$$;

-- 4. Create trigger to encrypt trabajador data on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_trabajador_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to encrypt email if changed
  IF NEW.email IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.email IS DISTINCT FROM OLD.email) THEN
    NEW.email_encrypted := safe_encrypt(NEW.email);
  END IF;
  
  -- Try to encrypt telefono if changed
  IF NEW.telefono IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.telefono IS DISTINCT FROM OLD.telefono) THEN
    NEW.telefono_encrypted := safe_encrypt(NEW.telefono);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_trabajador_on_change ON public.trabajadores_nom035;
CREATE TRIGGER encrypt_trabajador_on_change
BEFORE INSERT OR UPDATE ON public.trabajadores_nom035
FOR EACH ROW EXECUTE FUNCTION public.encrypt_trabajador_data();

-- 5. Update validate_questionnaire_token to use safe decryption
CREATE OR REPLACE FUNCTION public.validate_questionnaire_token(p_token text)
RETURNS TABLE (
  token_id uuid,
  trabajador_id uuid,
  empresa_id uuid,
  tipo_guia text,
  usado boolean,
  fecha_expiracion timestamptz,
  trabajador_nombre text,
  trabajador_email text,
  trabajador_telefono text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as token_id,
    t.trabajador_id,
    t.empresa_id,
    t.tipo_guia,
    t.usado,
    t.fecha_expiracion,
    tr.nombre_completo as trabajador_nombre,
    -- Use decrypted data if available, fallback to plain text
    COALESCE(safe_decrypt(tr.email_encrypted, tr.email), tr.email) as trabajador_email,
    COALESCE(safe_decrypt(tr.telefono_encrypted, tr.telefono), tr.telefono) as trabajador_telefono
  FROM tokens_cuestionario_nom035 t
  JOIN trabajadores_nom035 tr ON tr.id = t.trabajador_id
  WHERE t.token = p_token
  LIMIT 1;
END;
$$;