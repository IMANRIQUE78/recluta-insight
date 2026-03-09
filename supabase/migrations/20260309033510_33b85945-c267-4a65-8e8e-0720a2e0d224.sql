
-- CRITICAL FIX 1: Privilege Escalation - user_roles
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios roles" ON public.user_roles;

-- CRITICAL FIX 2: suscripcion_reclutador open ALL access
DROP POLICY IF EXISTS "Sistema puede gestionar suscripciones reclutador" ON public.suscripcion_reclutador;

CREATE POLICY "Reclutadores pueden crear su suscripción"
ON public.suscripcion_reclutador FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = suscripcion_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

CREATE POLICY "Reclutadores pueden actualizar su suscripción"
ON public.suscripcion_reclutador FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = suscripcion_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

-- CRITICAL FIX 3: creditos_heredados_reclutador open UPDATE/INSERT
DROP POLICY IF EXISTS "Sistema puede actualizar créditos heredados" ON public.creditos_heredados_reclutador;
DROP POLICY IF EXISTS "Sistema puede insertar créditos heredados" ON public.creditos_heredados_reclutador;

CREATE POLICY "Admin empresa puede insertar créditos heredados"
ON public.creditos_heredados_reclutador FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = creditos_heredados_reclutador.empresa_id
  )
);

CREATE POLICY "Admin empresa puede actualizar créditos heredados"
ON public.creditos_heredados_reclutador FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = creditos_heredados_reclutador.empresa_id
  )
);

-- CRITICAL FIX 4: Financial tables with open INSERT
DROP POLICY IF EXISTS "Sistema puede insertar wallet reclutador" ON public.wallet_reclutador;
CREATE POLICY "Reclutador puede crear su wallet"
ON public.wallet_reclutador FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = wallet_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sistema puede insertar wallet empresa" ON public.wallet_empresa;
CREATE POLICY "Admin empresa puede crear wallet"
ON public.wallet_empresa FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_empresa'::app_role
    AND user_roles.empresa_id = wallet_empresa.empresa_id
  )
);

DROP POLICY IF EXISTS "Sistema puede insertar movimientos" ON public.movimientos_creditos;
CREATE POLICY "Usuarios autenticados pueden registrar sus movimientos"
ON public.movimientos_creditos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reclutador_user_id);

DROP POLICY IF EXISTS "Sistema puede insertar desbloqueos" ON public.acceso_identidad_candidato;
CREATE POLICY "Reclutador puede registrar desbloqueos"
ON public.acceso_identidad_candidato FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfil_reclutador
    WHERE perfil_reclutador.id = acceso_identidad_candidato.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sistema puede insertar compensaciones" ON public.creditos_compensacion;
CREATE POLICY "Solo admins pueden crear compensaciones"
ON public.creditos_compensacion FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Sistema puede insertar auditoría" ON public.sourcing_audit;
CREATE POLICY "Usuarios autenticados pueden registrar su auditoría"
ON public.sourcing_audit FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- FIX 5: estudios_socioeconomicos - restrict delivered studies
DROP POLICY IF EXISTS "Reclutadores pueden ver estudios entregados de candidatos" ON public.estudios_socioeconomicos;
