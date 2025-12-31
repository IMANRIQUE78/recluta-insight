
-- Allow candidates to see publications they have applied to, even if unpublished
CREATE POLICY "Candidatos pueden ver publicaciones de sus postulaciones"
ON public.publicaciones_marketplace
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM postulaciones p
    WHERE p.publicacion_id = publicaciones_marketplace.id
    AND p.candidato_user_id = auth.uid()
  )
);
