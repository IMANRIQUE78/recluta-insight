-- ============================================
-- PARTE 3: ROW LEVEL SECURITY
-- ============================================

-- EMPRESAS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede ver su empresa"
ON public.empresas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = empresas.id
  )
);

CREATE POLICY "Admin empresa puede actualizar su empresa"
ON public.empresas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = empresas.id
  )
);

CREATE POLICY "Usuarios autenticados pueden crear empresa"
ON public.empresas FOR INSERT
TO authenticated
WITH CHECK (true);

-- SUSCRIPCION EMPRESA
ALTER TABLE public.suscripcion_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede ver suscripción"
ON public.suscripcion_empresa FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = suscripcion_empresa.empresa_id
  )
);

CREATE POLICY "Admin empresa puede actualizar suscripción"
ON public.suscripcion_empresa FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = suscripcion_empresa.empresa_id
  )
);

CREATE POLICY "Sistema puede insertar suscripción"
ON public.suscripcion_empresa FOR INSERT
TO authenticated
WITH CHECK (true);

-- PERFIL RECLUTADOR
ALTER TABLE public.perfil_reclutador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reclutadores pueden ver su propio perfil"
ON public.perfil_reclutador FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Reclutadores pueden actualizar su propio perfil"
ON public.perfil_reclutador FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Reclutadores pueden insertar su propio perfil"
ON public.perfil_reclutador FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- SUSCRIPCION RECLUTADOR
ALTER TABLE public.suscripcion_reclutador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reclutadores pueden ver su suscripción"
ON public.suscripcion_reclutador FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = suscripcion_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

CREATE POLICY "Sistema puede gestionar suscripciones reclutador"
ON public.suscripcion_reclutador FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RECLUTADOR EMPRESA
ALTER TABLE public.reclutador_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reclutadores pueden ver sus asociaciones"
ON public.reclutador_empresa FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = reclutador_empresa.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

CREATE POLICY "Admin empresa puede ver asociaciones de su empresa"
ON public.reclutador_empresa FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = reclutador_empresa.empresa_id
  )
);

CREATE POLICY "Admin empresa puede crear asociaciones"
ON public.reclutador_empresa FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = reclutador_empresa.empresa_id
  )
);

CREATE POLICY "Admin empresa puede actualizar asociaciones"
ON public.reclutador_empresa FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = reclutador_empresa.empresa_id
  )
);

-- INVITACIONES
ALTER TABLE public.invitaciones_reclutador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin empresa puede gestionar invitaciones"
ON public.invitaciones_reclutador FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_empresa'
    AND empresa_id = invitaciones_reclutador.empresa_id
  )
);

CREATE POLICY "Reclutadores pueden ver invitaciones dirigidas a ellos"
ON public.invitaciones_reclutador FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = invitaciones_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);

CREATE POLICY "Reclutadores pueden actualizar invitaciones dirigidas a ellos"
ON public.invitaciones_reclutador FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfil_reclutador
    WHERE perfil_reclutador.id = invitaciones_reclutador.reclutador_id
    AND perfil_reclutador.user_id = auth.uid()
  )
);