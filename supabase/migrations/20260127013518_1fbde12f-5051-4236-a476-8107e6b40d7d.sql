
-- First, create the trigger for automatic encryption on INSERT/UPDATE
CREATE OR REPLACE TRIGGER encrypt_personal_data_trigger
  BEFORE INSERT OR UPDATE ON public.personal_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_personal_data();

-- Now encrypt all existing data that hasn't been encrypted yet
-- We use safe_encrypt which returns NULL if no encryption key is configured
UPDATE public.personal_empresa
SET 
  domicilio_encrypted = CASE 
    WHEN domicilio IS NOT NULL AND domicilio != '' AND domicilio_encrypted IS NULL 
    THEN safe_encrypt(domicilio) 
    ELSE domicilio_encrypted 
  END,
  colonia_encrypted = CASE 
    WHEN colonia IS NOT NULL AND colonia != '' AND colonia_encrypted IS NULL 
    THEN safe_encrypt(colonia) 
    ELSE colonia_encrypted 
  END,
  telefono_movil_encrypted = CASE 
    WHEN telefono_movil IS NOT NULL AND telefono_movil != '' AND telefono_movil_encrypted IS NULL 
    THEN safe_encrypt(telefono_movil) 
    ELSE telefono_movil_encrypted 
  END,
  telefono_emergencia_encrypted = CASE 
    WHEN telefono_emergencia IS NOT NULL AND telefono_emergencia != '' AND telefono_emergencia_encrypted IS NULL 
    THEN safe_encrypt(telefono_emergencia) 
    ELSE telefono_emergencia_encrypted 
  END,
  email_personal_encrypted = CASE 
    WHEN email_personal IS NOT NULL AND email_personal != '' AND email_personal_encrypted IS NULL 
    THEN safe_encrypt(email_personal) 
    ELSE email_personal_encrypted 
  END,
  nss_encrypted = CASE 
    WHEN nss IS NOT NULL AND nss != '' AND nss_encrypted IS NULL 
    THEN safe_encrypt(nss) 
    ELSE nss_encrypted 
  END,
  cuenta_bancaria_encrypted = CASE 
    WHEN cuenta_bancaria IS NOT NULL AND cuenta_bancaria != '' AND cuenta_bancaria_encrypted IS NULL 
    THEN safe_encrypt(cuenta_bancaria) 
    ELSE cuenta_bancaria_encrypted 
  END,
  curp_encrypted = CASE 
    WHEN curp IS NOT NULL AND curp != '' AND curp_encrypted IS NULL 
    THEN safe_encrypt(curp) 
    ELSE curp_encrypted 
  END,
  rfc_encrypted = CASE 
    WHEN rfc IS NOT NULL AND rfc != '' AND rfc_encrypted IS NULL 
    THEN safe_encrypt(rfc) 
    ELSE rfc_encrypted 
  END
WHERE 
  (domicilio IS NOT NULL AND domicilio_encrypted IS NULL) OR
  (colonia IS NOT NULL AND colonia_encrypted IS NULL) OR
  (telefono_movil IS NOT NULL AND telefono_movil_encrypted IS NULL) OR
  (telefono_emergencia IS NOT NULL AND telefono_emergencia_encrypted IS NULL) OR
  (email_personal IS NOT NULL AND email_personal_encrypted IS NULL) OR
  (nss IS NOT NULL AND nss_encrypted IS NULL) OR
  (cuenta_bancaria IS NOT NULL AND cuenta_bancaria_encrypted IS NULL) OR
  (curp IS NOT NULL AND curp_encrypted IS NULL) OR
  (rfc IS NOT NULL AND rfc_encrypted IS NULL);
