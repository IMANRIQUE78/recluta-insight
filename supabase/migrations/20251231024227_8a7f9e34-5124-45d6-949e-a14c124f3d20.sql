-- Política para que los reclutadores puedan ver perfiles de candidatos en el pool
-- Solo pueden ver datos públicos (el modal filtra los datos de identidad en el frontend)
CREATE POLICY "Reclutadores pueden ver perfiles de candidatos"
  ON public.perfil_candidato
  FOR SELECT
  USING (
    has_role(auth.uid(), 'reclutador'::app_role)
  );