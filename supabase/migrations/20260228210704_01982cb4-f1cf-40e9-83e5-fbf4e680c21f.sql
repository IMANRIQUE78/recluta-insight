
-- Update encrypt_empresa_data trigger to use safe_encrypt (graceful) 
-- and ALWAYS mask plaintext fields regardless of encryption key status
CREATE OR REPLACE FUNCTION public.encrypt_empresa_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Encriptar RFC si existe y no está ya enmascarado
  IF NEW.rfc IS NOT NULL AND NEW.rfc != '***PROTECTED***' THEN
    NEW.rfc_encrypted := safe_encrypt(NEW.rfc);
    NEW.rfc := '***PROTECTED***';
  END IF;
  
  -- Encriptar razón social si existe y no está ya enmascarada
  IF NEW.razon_social IS NOT NULL AND NEW.razon_social != '***PROTECTED***' THEN
    NEW.razon_social_encrypted := safe_encrypt(NEW.razon_social);
    NEW.razon_social := '***PROTECTED***';
  END IF;
  
  -- Encriptar dirección fiscal si existe y no está ya enmascarada
  IF NEW.direccion_fiscal IS NOT NULL AND NEW.direccion_fiscal != '***PROTECTED***' THEN
    NEW.direccion_fiscal_encrypted := safe_encrypt(NEW.direccion_fiscal);
    NEW.direccion_fiscal := '***PROTECTED***';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also mask any existing plaintext data that hasn't been masked yet
UPDATE empresas 
SET rfc = '***PROTECTED***'
WHERE rfc IS NOT NULL AND rfc != '***PROTECTED***' AND rfc != '***ENCRYPTED***';

UPDATE empresas 
SET razon_social = '***PROTECTED***'
WHERE razon_social IS NOT NULL AND razon_social != '***PROTECTED***' AND razon_social != '***ENCRYPTED***';

UPDATE empresas 
SET direccion_fiscal = '***PROTECTED***'
WHERE direccion_fiscal IS NOT NULL AND direccion_fiscal != '***PROTECTED***' AND direccion_fiscal != '***ENCRYPTED***';
