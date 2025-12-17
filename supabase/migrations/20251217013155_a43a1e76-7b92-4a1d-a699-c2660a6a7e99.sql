-- Create secure RPC function to validate token without exposing all tokens
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
    tr.email as trabajador_email,
    tr.telefono as trabajador_telefono
  FROM tokens_cuestionario_nom035 t
  JOIN trabajadores_nom035 tr ON tr.id = t.trabajador_id
  WHERE t.token = p_token
  LIMIT 1;
END;
$$;

-- Create secure RPC function to mark token as used (only if valid)
CREATE OR REPLACE FUNCTION public.mark_questionnaire_token_used(p_token_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean;
BEGIN
  UPDATE tokens_cuestionario_nom035
  SET usado = true
  WHERE id = p_token_id
    AND usado = false
    AND fecha_expiracion > now();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Tokens pueden ser validados públicamente" ON tokens_cuestionario_nom035;

-- Remove the dangerous public UPDATE policy  
DROP POLICY IF EXISTS "Tokens pueden ser actualizados al usar" ON tokens_cuestionario_nom035;