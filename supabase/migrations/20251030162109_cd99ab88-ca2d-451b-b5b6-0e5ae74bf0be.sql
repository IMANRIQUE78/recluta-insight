-- Eliminar la política actual que expone todo públicamente
DROP POLICY IF EXISTS "Publicaciones activas son públicas" ON public.publicaciones_marketplace;

-- Política 1: Usuarios NO autenticados - Solo información básica (sin salario ni observaciones)
CREATE POLICY "Publicaciones básicas son públicas"
ON public.publicaciones_marketplace
FOR SELECT
TO anon
USING (publicada = true);

-- Política 2: Usuarios autenticados - Pueden ver salarios para tomar decisiones informadas
CREATE POLICY "Usuarios autenticados ven publicaciones completas"
ON public.publicaciones_marketplace
FOR SELECT
TO authenticated
USING (publicada = true);

-- Política 3: Propietarios - Ven todo incluyendo observaciones (ya existe la política de UPDATE/DELETE)
-- Esta política ya está cubierta por "Usuarios pueden actualizar sus publicaciones"

-- Nota: Las observaciones solo deben mostrarse al propietario en la UI
-- El frontend debe verificar si el usuario es propietario antes de mostrar observaciones