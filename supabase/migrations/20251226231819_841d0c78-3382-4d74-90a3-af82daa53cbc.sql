
-- Tabla de wallet para empresas
CREATE TABLE public.wallet_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  creditos_disponibles INTEGER NOT NULL DEFAULT 0,
  creditos_totales_comprados INTEGER NOT NULL DEFAULT 0,
  creditos_heredados_totales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT wallet_empresa_unique UNIQUE (empresa_id),
  CONSTRAINT creditos_no_negativos CHECK (creditos_disponibles >= 0)
);

-- Tabla de wallet para reclutadores
CREATE TABLE public.wallet_reclutador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reclutador_id UUID NOT NULL REFERENCES public.perfil_reclutador(id) ON DELETE CASCADE,
  creditos_propios INTEGER NOT NULL DEFAULT 0,
  creditos_heredados INTEGER NOT NULL DEFAULT 0,
  creditos_totales_comprados INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT wallet_reclutador_unique UNIQUE (reclutador_id),
  CONSTRAINT creditos_propios_no_negativos CHECK (creditos_propios >= 0),
  CONSTRAINT creditos_heredados_no_negativos CHECK (creditos_heredados >= 0)
);

-- Tabla para gestionar herencia de créditos de empresa a reclutador
CREATE TABLE public.asignacion_creditos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_empresa_id UUID NOT NULL REFERENCES public.wallet_empresa(id) ON DELETE CASCADE,
  wallet_reclutador_id UUID NOT NULL REFERENCES public.wallet_reclutador(id) ON DELETE CASCADE,
  creditos_asignados INTEGER NOT NULL,
  creditos_consumidos INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT creditos_asignados_positivos CHECK (creditos_asignados > 0),
  CONSTRAINT creditos_consumidos_no_negativos CHECK (creditos_consumidos >= 0),
  CONSTRAINT creditos_consumidos_no_excede CHECK (creditos_consumidos <= creditos_asignados)
);

-- Enum para tipos de acción
CREATE TYPE tipo_accion_credito AS ENUM (
  'compra_creditos',
  'publicacion_vacante',
  'acceso_pool_candidatos',
  'descarga_cv',
  'contacto_candidato',
  'estudio_socioeconomico',
  'evaluacion_psicometrica',
  'sourcing_ia',
  'herencia_creditos',
  'devolucion_creditos',
  'ajuste_manual',
  'expiracion_creditos'
);

-- Enum para origen del pago
CREATE TYPE origen_pago AS ENUM (
  'empresa',
  'reclutador',
  'heredado_empresa'
);

-- Enum para método de ejecución
CREATE TYPE metodo_ejecucion AS ENUM (
  'manual',
  'automatico_ia',
  'sistema'
);

-- Tabla de auditoría inmutable de movimientos de créditos
CREATE TABLE public.movimientos_creditos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identificadores de origen
  origen_pago origen_pago NOT NULL,
  wallet_empresa_id UUID REFERENCES public.wallet_empresa(id),
  wallet_reclutador_id UUID REFERENCES public.wallet_reclutador(id),
  
  -- Contexto de la acción
  empresa_id UUID REFERENCES public.empresas(id),
  reclutador_user_id UUID NOT NULL,
  vacante_id UUID REFERENCES public.vacantes(id),
  candidato_user_id UUID,
  postulacion_id UUID REFERENCES public.postulaciones(id),
  
  -- Detalles de la acción
  tipo_accion tipo_accion_credito NOT NULL,
  metodo metodo_ejecucion NOT NULL DEFAULT 'manual',
  creditos_cantidad INTEGER NOT NULL,
  creditos_antes INTEGER NOT NULL,
  creditos_despues INTEGER NOT NULL,
  
  -- Contexto adicional
  descripcion TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  
  -- Restricciones
  CONSTRAINT movimiento_requiere_wallet CHECK (
    wallet_empresa_id IS NOT NULL OR wallet_reclutador_id IS NOT NULL
  )
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_movimientos_empresa ON public.movimientos_creditos(empresa_id);
CREATE INDEX idx_movimientos_reclutador ON public.movimientos_creditos(reclutador_user_id);
CREATE INDEX idx_movimientos_vacante ON public.movimientos_creditos(vacante_id);
CREATE INDEX idx_movimientos_tipo ON public.movimientos_creditos(tipo_accion);
CREATE INDEX idx_movimientos_fecha ON public.movimientos_creditos(created_at DESC);
CREATE INDEX idx_asignacion_wallet_empresa ON public.asignacion_creditos(wallet_empresa_id);
CREATE INDEX idx_asignacion_wallet_reclutador ON public.asignacion_creditos(wallet_reclutador_id);

-- Trigger para updated_at en wallets
CREATE TRIGGER update_wallet_empresa_updated_at
  BEFORE UPDATE ON public.wallet_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_reclutador_updated_at
  BEFORE UPDATE ON public.wallet_reclutador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asignacion_creditos_updated_at
  BEFORE UPDATE ON public.asignacion_creditos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para wallet_empresa
ALTER TABLE public.wallet_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede ver su wallet"
  ON public.wallet_empresa FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = wallet_empresa.empresa_id
  ));

CREATE POLICY "Admin empresa puede actualizar su wallet"
  ON public.wallet_empresa FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = wallet_empresa.empresa_id
  ));

CREATE POLICY "Sistema puede insertar wallet empresa"
  ON public.wallet_empresa FOR INSERT
  WITH CHECK (true);

-- RLS para wallet_reclutador
ALTER TABLE public.wallet_reclutador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reclutador puede ver su wallet"
  ON public.wallet_reclutador FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = wallet_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  ));

CREATE POLICY "Reclutador puede actualizar su wallet"
  ON public.wallet_reclutador FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = wallet_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  ));

CREATE POLICY "Sistema puede insertar wallet reclutador"
  ON public.wallet_reclutador FOR INSERT
  WITH CHECK (true);

-- RLS para asignacion_creditos
ALTER TABLE public.asignacion_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede ver asignaciones de su empresa"
  ON public.asignacion_creditos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wallet_empresa we
    JOIN user_roles ur ON ur.empresa_id = we.empresa_id
    WHERE we.id = asignacion_creditos.wallet_empresa_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'::app_role
  ));

CREATE POLICY "Admin empresa puede crear asignaciones"
  ON public.asignacion_creditos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wallet_empresa we
    JOIN user_roles ur ON ur.empresa_id = we.empresa_id
    WHERE we.id = asignacion_creditos.wallet_empresa_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'::app_role
  ));

CREATE POLICY "Admin empresa puede actualizar asignaciones"
  ON public.asignacion_creditos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM wallet_empresa we
    JOIN user_roles ur ON ur.empresa_id = we.empresa_id
    WHERE we.id = asignacion_creditos.wallet_empresa_id
    AND ur.user_id = auth.uid()
    AND ur.role = 'admin_empresa'::app_role
  ));

CREATE POLICY "Reclutador puede ver sus asignaciones"
  ON public.asignacion_creditos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wallet_reclutador wr
    JOIN perfil_reclutador pr ON pr.id = wr.reclutador_id
    WHERE wr.id = asignacion_creditos.wallet_reclutador_id
    AND pr.user_id = auth.uid()
  ));

-- RLS para movimientos_creditos (INMUTABLE - solo INSERT y SELECT)
ALTER TABLE public.movimientos_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede ver movimientos de su empresa"
  ON public.movimientos_creditos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = movimientos_creditos.empresa_id
  ));

CREATE POLICY "Reclutador puede ver sus movimientos"
  ON public.movimientos_creditos FOR SELECT
  USING (reclutador_user_id = auth.uid());

CREATE POLICY "Sistema puede insertar movimientos"
  ON public.movimientos_creditos FOR INSERT
  WITH CHECK (true);

-- NO HAY POLÍTICAS DE UPDATE O DELETE PARA movimientos_creditos (INMUTABLE)

-- Función para obtener créditos disponibles de un reclutador (propios + heredados)
CREATE OR REPLACE FUNCTION public.get_creditos_disponibles_reclutador(p_reclutador_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creditos_propios INTEGER;
  v_creditos_heredados INTEGER;
BEGIN
  SELECT COALESCE(creditos_propios, 0), COALESCE(creditos_heredados, 0)
  INTO v_creditos_propios, v_creditos_heredados
  FROM wallet_reclutador
  WHERE reclutador_id = p_reclutador_id;
  
  RETURN COALESCE(v_creditos_propios, 0) + COALESCE(v_creditos_heredados, 0);
END;
$$;

-- Función para registrar movimiento de créditos (garantiza auditoría)
CREATE OR REPLACE FUNCTION public.registrar_movimiento_creditos(
  p_origen_pago origen_pago,
  p_wallet_empresa_id UUID,
  p_wallet_reclutador_id UUID,
  p_empresa_id UUID,
  p_reclutador_user_id UUID,
  p_tipo_accion tipo_accion_credito,
  p_creditos_cantidad INTEGER,
  p_descripcion TEXT,
  p_vacante_id UUID DEFAULT NULL,
  p_candidato_user_id UUID DEFAULT NULL,
  p_postulacion_id UUID DEFAULT NULL,
  p_metodo metodo_ejecucion DEFAULT 'manual',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creditos_antes INTEGER;
  v_creditos_despues INTEGER;
  v_movimiento_id UUID;
BEGIN
  -- Obtener créditos antes según origen
  IF p_wallet_empresa_id IS NOT NULL THEN
    SELECT creditos_disponibles INTO v_creditos_antes
    FROM wallet_empresa WHERE id = p_wallet_empresa_id;
  ELSIF p_wallet_reclutador_id IS NOT NULL THEN
    SELECT creditos_propios + creditos_heredados INTO v_creditos_antes
    FROM wallet_reclutador WHERE id = p_wallet_reclutador_id;
  END IF;
  
  v_creditos_antes := COALESCE(v_creditos_antes, 0);
  v_creditos_despues := v_creditos_antes + p_creditos_cantidad;
  
  -- Insertar movimiento
  INSERT INTO movimientos_creditos (
    origen_pago,
    wallet_empresa_id,
    wallet_reclutador_id,
    empresa_id,
    reclutador_user_id,
    vacante_id,
    candidato_user_id,
    postulacion_id,
    tipo_accion,
    metodo,
    creditos_cantidad,
    creditos_antes,
    creditos_despues,
    descripcion,
    metadata
  ) VALUES (
    p_origen_pago,
    p_wallet_empresa_id,
    p_wallet_reclutador_id,
    p_empresa_id,
    p_reclutador_user_id,
    p_vacante_id,
    p_candidato_user_id,
    p_postulacion_id,
    p_tipo_accion,
    p_metodo,
    p_creditos_cantidad,
    v_creditos_antes,
    v_creditos_despues,
    p_descripcion,
    p_metadata
  ) RETURNING id INTO v_movimiento_id;
  
  RETURN v_movimiento_id;
END;
$$;
