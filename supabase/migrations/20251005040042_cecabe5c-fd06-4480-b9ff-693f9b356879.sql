-- Arreglar el search_path para las funciones - recrear con CASCADE
DROP TRIGGER IF EXISTS generate_folio_trigger ON vacantes;
DROP FUNCTION IF EXISTS generate_vacante_folio() CASCADE;

CREATE OR REPLACE FUNCTION generate_vacante_folio()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  new_folio TEXT;
BEGIN
  -- Obtener el siguiente número secuencial
  SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 'VAC-(.*)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM vacantes
  WHERE user_id = NEW.user_id;
  
  -- Generar el folio con formato VAC-XXXX
  new_folio := 'VAC-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.folio := new_folio;
  RETURN NEW;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER generate_folio_trigger
  BEFORE INSERT ON vacantes
  FOR EACH ROW
  WHEN (NEW.folio IS NULL OR NEW.folio = '')
  EXECUTE FUNCTION generate_vacante_folio();