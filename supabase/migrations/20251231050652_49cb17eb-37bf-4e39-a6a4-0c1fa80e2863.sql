
-- Drop the policy that causes infinite recursion
DROP POLICY IF EXISTS "Candidatos pueden ver publicaciones de sus postulaciones" ON public.publicaciones_marketplace;
