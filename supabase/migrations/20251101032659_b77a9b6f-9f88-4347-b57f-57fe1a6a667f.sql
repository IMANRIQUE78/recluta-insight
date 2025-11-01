-- Eliminar la política restrictiva actual de INSERT en empresas
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empresa" ON public.empresas;

-- Crear nueva política que permita a usuarios autenticados crear empresas
CREATE POLICY "Usuarios autenticados pueden crear empresa"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (true);