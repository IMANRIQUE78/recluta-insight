
-- ============================================================================
-- FUNCIÓN 1: Deducir créditos de reclutador (atómico con SELECT FOR UPDATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deducir_creditos_reclutador_atomico(
  p_wallet_id UUID,
  p_costo INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_creditos_propios INTEGER;
  v_creditos_heredados INTEGER;
  v_nuevo_propios INTEGER;
  v_nuevo_heredados INTEGER;
  v_origen_usado TEXT;
BEGIN
  -- Bloquear fila para evitar race conditions
  SELECT creditos_propios, creditos_heredados
  INTO v_creditos_propios, v_creditos_heredados
  FROM wallet_reclutador
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet no encontrado');
  END IF;

  IF (v_creditos_propios + v_creditos_heredados) < p_costo THEN
    RETURN json_build_object('success', false, 'error', 'Créditos insuficientes');
  END IF;

  -- Priorizar heredados sobre propios
  IF v_creditos_heredados >= p_costo THEN
    v_nuevo_heredados := v_creditos_heredados - p_costo;
    v_nuevo_propios := v_creditos_propios;
    v_origen_usado := 'heredado_empresa';
  ELSIF v_creditos_heredados > 0 THEN
    v_nuevo_heredados := 0;
    v_nuevo_propios := v_creditos_propios - (p_costo - v_creditos_heredados);
    v_origen_usado := 'heredado_empresa';
  ELSE
    v_nuevo_heredados := 0;
    v_nuevo_propios := v_creditos_propios - p_costo;
    v_origen_usado := 'reclutador';
  END IF;

  UPDATE wallet_reclutador
  SET creditos_propios = v_nuevo_propios,
      creditos_heredados = v_nuevo_heredados,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  RETURN json_build_object(
    'success', true,
    'creditos_deducidos', p_costo,
    'origen_usado', v_origen_usado,
    'nuevo_saldo_propios', v_nuevo_propios,
    'nuevo_saldo_heredados', v_nuevo_heredados
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- FUNCIÓN 2: Deducir créditos de empresa (atómico)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deducir_creditos_empresa_atomico(
  p_wallet_id UUID,
  p_costo INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_creditos_disponibles INTEGER;
  v_nuevo_saldo INTEGER;
BEGIN
  SELECT creditos_disponibles
  INTO v_creditos_disponibles
  FROM wallet_empresa
  WHERE id = p_wallet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Wallet de empresa no encontrado');
  END IF;

  IF v_creditos_disponibles < p_costo THEN
    RETURN json_build_object('success', false, 'error', 'Créditos insuficientes');
  END IF;

  v_nuevo_saldo := v_creditos_disponibles - p_costo;

  UPDATE wallet_empresa
  SET creditos_disponibles = v_nuevo_saldo,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  RETURN json_build_object(
    'success', true,
    'creditos_deducidos', p_costo,
    'origen_usado', 'empresa',
    'nuevo_saldo', v_nuevo_saldo
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================================
-- TABLA: Compensación de créditos por errores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creditos_compensacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  wallet_reclutador_id UUID REFERENCES public.wallet_reclutador(id),
  wallet_empresa_id UUID REFERENCES public.wallet_empresa(id),
  creditos_compensar INTEGER NOT NULL,
  razon TEXT NOT NULL,
  lote_sourcing UUID,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  procesado_at TIMESTAMPTZ,
  procesado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creditos_compensacion ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y gestionar compensaciones
CREATE POLICY "Sistema puede insertar compensaciones"
  ON public.creditos_compensacion FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins pueden ver compensaciones"
  ON public.creditos_compensacion FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins pueden actualizar compensaciones"
  ON public.creditos_compensacion FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_creditos_compensacion_estado 
  ON public.creditos_compensacion(estado) WHERE estado = 'pendiente';

-- Permisos: solo service_role puede ejecutar funciones atómicas
REVOKE ALL ON FUNCTION public.deducir_creditos_reclutador_atomico FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deducir_creditos_reclutador_atomico TO service_role;

REVOKE ALL ON FUNCTION public.deducir_creditos_empresa_atomico FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deducir_creditos_empresa_atomico TO service_role;
