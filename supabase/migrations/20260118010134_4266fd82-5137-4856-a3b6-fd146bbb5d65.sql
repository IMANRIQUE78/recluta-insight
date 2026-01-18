
-- Crear tabla de personal de empresa
CREATE TABLE public.personal_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo_empleado TEXT NOT NULL,
  
  -- Datos básicos
  estatus TEXT NOT NULL DEFAULT 'activo' CHECK (estatus IN ('activo', 'inactivo', 'reingreso')),
  nombre_completo TEXT NOT NULL,
  genero TEXT,
  puesto TEXT,
  area TEXT,
  jefe_directo TEXT,
  
  -- Fechas
  fecha_nacimiento DATE,
  fecha_ingreso DATE,
  fecha_salida DATE,
  
  -- Dirección (campos sensibles - se encriptarán)
  domicilio TEXT,
  domicilio_encrypted TEXT,
  colonia TEXT,
  colonia_encrypted TEXT,
  alcaldia_municipio TEXT,
  
  -- Contacto (campos sensibles - se encriptarán)
  telefono_movil TEXT,
  telefono_movil_encrypted TEXT,
  telefono_emergencia TEXT,
  telefono_emergencia_encrypted TEXT,
  email_personal TEXT,
  email_personal_encrypted TEXT,
  email_corporativo TEXT,
  
  -- Datos personales
  estado_civil TEXT,
  escolaridad TEXT,
  enfermedades_alergias TEXT,
  
  -- Datos fiscales/bancarios (campos MUY sensibles - se encriptarán)
  nss TEXT,
  nss_encrypted TEXT,
  cuenta_bancaria TEXT,
  cuenta_bancaria_encrypted TEXT,
  curp TEXT,
  curp_encrypted TEXT,
  rfc TEXT,
  rfc_encrypted TEXT,
  
  -- Datos laborales
  reclutador_asignado TEXT,
  sueldo_asignado NUMERIC(12,2),
  finiquito NUMERIC(12,2),
  observaciones TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.personal_empresa ENABLE ROW LEVEL SECURITY;

-- Índices para búsquedas
CREATE INDEX idx_personal_empresa_empresa_id ON public.personal_empresa(empresa_id);
CREATE INDEX idx_personal_empresa_estatus ON public.personal_empresa(estatus);
CREATE INDEX idx_personal_empresa_codigo ON public.personal_empresa(codigo_empleado);

-- Trigger para updated_at
CREATE TRIGGER update_personal_empresa_updated_at
  BEFORE UPDATE ON public.personal_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Función para generar código de empleado único por empresa
CREATE OR REPLACE FUNCTION public.generate_personal_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  empresa_codigo TEXT;
  next_num INTEGER;
BEGIN
  IF NEW.codigo_empleado IS NULL OR NEW.codigo_empleado = '' THEN
    -- Obtener código de empresa
    SELECT codigo_empresa INTO empresa_codigo
    FROM empresas WHERE id = NEW.empresa_id;
    
    -- Contar empleados existentes de esta empresa
    SELECT COUNT(*) + 1 INTO next_num
    FROM personal_empresa WHERE empresa_id = NEW.empresa_id;
    
    -- Generar código: EMP-CODIGOEMPRESA-NUMERO
    NEW.codigo_empleado := 'EMP-' || COALESCE(SUBSTRING(empresa_codigo FROM 5), 'XXX') || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para generar código automático
CREATE TRIGGER generate_personal_codigo_trigger
  BEFORE INSERT ON public.personal_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_personal_codigo();

-- Función para encriptar datos sensibles del personal
CREATE OR REPLACE FUNCTION public.encrypt_personal_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Encriptar domicilio
  IF NEW.domicilio IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.domicilio IS DISTINCT FROM OLD.domicilio) THEN
    NEW.domicilio_encrypted := safe_encrypt(NEW.domicilio);
  END IF;
  
  -- Encriptar colonia
  IF NEW.colonia IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.colonia IS DISTINCT FROM OLD.colonia) THEN
    NEW.colonia_encrypted := safe_encrypt(NEW.colonia);
  END IF;
  
  -- Encriptar teléfono móvil
  IF NEW.telefono_movil IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.telefono_movil IS DISTINCT FROM OLD.telefono_movil) THEN
    NEW.telefono_movil_encrypted := safe_encrypt(NEW.telefono_movil);
  END IF;
  
  -- Encriptar teléfono emergencia
  IF NEW.telefono_emergencia IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.telefono_emergencia IS DISTINCT FROM OLD.telefono_emergencia) THEN
    NEW.telefono_emergencia_encrypted := safe_encrypt(NEW.telefono_emergencia);
  END IF;
  
  -- Encriptar email personal
  IF NEW.email_personal IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.email_personal IS DISTINCT FROM OLD.email_personal) THEN
    NEW.email_personal_encrypted := safe_encrypt(NEW.email_personal);
  END IF;
  
  -- Encriptar NSS
  IF NEW.nss IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.nss IS DISTINCT FROM OLD.nss) THEN
    NEW.nss_encrypted := safe_encrypt(NEW.nss);
  END IF;
  
  -- Encriptar cuenta bancaria
  IF NEW.cuenta_bancaria IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.cuenta_bancaria IS DISTINCT FROM OLD.cuenta_bancaria) THEN
    NEW.cuenta_bancaria_encrypted := safe_encrypt(NEW.cuenta_bancaria);
  END IF;
  
  -- Encriptar CURP
  IF NEW.curp IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.curp IS DISTINCT FROM OLD.curp) THEN
    NEW.curp_encrypted := safe_encrypt(NEW.curp);
  END IF;
  
  -- Encriptar RFC
  IF NEW.rfc IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.rfc IS DISTINCT FROM OLD.rfc) THEN
    NEW.rfc_encrypted := safe_encrypt(NEW.rfc);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para encriptación automática
CREATE TRIGGER encrypt_personal_data_trigger
  BEFORE INSERT OR UPDATE ON public.personal_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_personal_data();

-- RLS Policies
-- Solo admins de empresa pueden ver personal de su empresa
CREATE POLICY "Admins empresa pueden ver personal"
  ON public.personal_empresa
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = personal_empresa.empresa_id
      AND ur.role IN ('admin_empresa', 'admin')
    )
  );

-- Solo admins de empresa pueden insertar personal
CREATE POLICY "Admins empresa pueden insertar personal"
  ON public.personal_empresa
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = personal_empresa.empresa_id
      AND ur.role IN ('admin_empresa', 'admin')
    )
  );

-- Solo admins de empresa pueden actualizar personal
CREATE POLICY "Admins empresa pueden actualizar personal"
  ON public.personal_empresa
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = personal_empresa.empresa_id
      AND ur.role IN ('admin_empresa', 'admin')
    )
  );

-- Solo admins de empresa pueden eliminar personal
CREATE POLICY "Admins empresa pueden eliminar personal"
  ON public.personal_empresa
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.empresa_id = personal_empresa.empresa_id
      AND ur.role IN ('admin_empresa', 'admin')
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE public.personal_empresa IS 'Base de datos de personal de cada empresa con datos sensibles encriptados';
COMMENT ON COLUMN public.personal_empresa.nss_encrypted IS 'NSS encriptado con safe_encrypt()';
COMMENT ON COLUMN public.personal_empresa.cuenta_bancaria_encrypted IS 'Cuenta bancaria encriptada con safe_encrypt()';
COMMENT ON COLUMN public.personal_empresa.curp_encrypted IS 'CURP encriptado con safe_encrypt()';
COMMENT ON COLUMN public.personal_empresa.rfc_encrypted IS 'RFC encriptado con safe_encrypt()';
