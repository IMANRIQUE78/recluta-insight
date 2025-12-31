-- Política para que cualquier reclutador autenticado pueda ver estudios ENTREGADOS 
-- de candidatos (para enriquecer el perfil del candidato)
-- Solo estudios entregados y con visibilidad limitada implícita por la app (6 meses)
CREATE POLICY "Reclutadores pueden ver estudios entregados de candidatos"
ON public.estudios_socioeconomicos
FOR SELECT
USING (
  estatus = 'entregado' 
  AND fecha_entrega IS NOT NULL
  AND has_role(auth.uid(), 'reclutador')
);