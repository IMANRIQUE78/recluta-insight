
-- 1. Crear función para generar códigos únicos globales
CREATE OR REPLACE FUNCTION public.generate_unique_code(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin I,O,0,1 para evitar confusión
  i INTEGER;
  code_exists BOOLEAN := TRUE;
BEGIN
  WHILE code_exists LOOP
    new_code := prefix || '-';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Verificar unicidad en todas las tablas
    SELECT EXISTS (
      SELECT 1 FROM vacantes WHERE folio = new_code
      UNION ALL
      SELECT 1 FROM empresas WHERE codigo_empresa = new_code
      UNION ALL
      SELECT 1 FROM perfil_reclutador WHERE codigo_reclutador = new_code
      UNION ALL
      SELECT 1 FROM perfil_candidato WHERE codigo_candidato = new_code
    ) INTO code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- 2. Agregar columna codigo_candidato si no existe
ALTER TABLE perfil_candidato 
ADD COLUMN IF NOT EXISTS codigo_candidato TEXT UNIQUE;

-- 3. Actualizar trigger de vacantes para usar folio global único
CREATE OR REPLACE FUNCTION public.generate_vacante_folio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := generate_unique_code('VAC');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Crear trigger para codigo_empresa
CREATE OR REPLACE FUNCTION public.generate_empresa_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.codigo_empresa IS NULL OR NEW.codigo_empresa = '' OR length(NEW.codigo_empresa) < 10 THEN
    NEW.codigo_empresa := generate_unique_code('EMP');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_empresa_codigo_trigger ON empresas;
CREATE TRIGGER generate_empresa_codigo_trigger
  BEFORE INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION generate_empresa_codigo();

-- 5. Crear trigger para codigo_reclutador
CREATE OR REPLACE FUNCTION public.generate_reclutador_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.codigo_reclutador IS NULL OR NEW.codigo_reclutador = '' OR length(NEW.codigo_reclutador) < 10 THEN
    NEW.codigo_reclutador := generate_unique_code('REC');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_reclutador_codigo_trigger ON perfil_reclutador;
CREATE TRIGGER generate_reclutador_codigo_trigger
  BEFORE INSERT ON perfil_reclutador
  FOR EACH ROW
  EXECUTE FUNCTION generate_reclutador_codigo();

-- 6. Crear trigger para codigo_candidato
CREATE OR REPLACE FUNCTION public.generate_candidato_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.codigo_candidato IS NULL OR NEW.codigo_candidato = '' THEN
    NEW.codigo_candidato := generate_unique_code('CAN');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_candidato_codigo_trigger ON perfil_candidato;
CREATE TRIGGER generate_candidato_codigo_trigger
  BEFORE INSERT ON perfil_candidato
  FOR EACH ROW
  EXECUTE FUNCTION generate_candidato_codigo();

-- 7. Actualizar vacantes existentes con folios únicos globales
UPDATE vacantes SET folio = generate_unique_code('VAC') WHERE folio LIKE 'VAC-%' AND length(folio) < 10;

-- 8. Actualizar empresas existentes con códigos únicos
UPDATE empresas SET codigo_empresa = generate_unique_code('EMP') WHERE length(codigo_empresa) < 10;

-- 9. Actualizar reclutadores existentes con códigos únicos
UPDATE perfil_reclutador SET codigo_reclutador = generate_unique_code('REC') WHERE length(codigo_reclutador) < 10;

-- 10. Actualizar candidatos existentes con códigos únicos
UPDATE perfil_candidato SET codigo_candidato = generate_unique_code('CAN') WHERE codigo_candidato IS NULL;

-- 11. Agregar constraints de unicidad donde falten
ALTER TABLE vacantes DROP CONSTRAINT IF EXISTS vacantes_folio_unique;
ALTER TABLE vacantes ADD CONSTRAINT vacantes_folio_unique UNIQUE (folio);

-- Nota: empresas.codigo_empresa y perfil_reclutador.codigo_reclutador ya tienen defaults únicos
-- pero ahora usarán el nuevo formato
