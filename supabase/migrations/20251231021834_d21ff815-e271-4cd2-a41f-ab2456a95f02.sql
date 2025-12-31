-- Eliminar la política permisiva existente
DROP POLICY IF EXISTS "Sistema puede gestionar estadísticas" ON public.estadisticas_verificador;

-- Política: Verificadores pueden insertar sus propias estadísticas
CREATE POLICY "Verificadores pueden insertar sus estadísticas"
ON public.estadisticas_verificador FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Verificadores pueden actualizar sus propias estadísticas
CREATE POLICY "Verificadores pueden actualizar sus estadísticas"
ON public.estadisticas_verificador FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Admins pueden ver todas las estadísticas
CREATE POLICY "Admins pueden ver todas las estadísticas"
ON public.estadisticas_verificador FOR SELECT
USING (has_role(auth.uid(), 'admin'));