
-- Allow verificadores to create their own socioeconomic studies
CREATE POLICY "Verificadores pueden crear estudios propios"
ON public.estudios_socioeconomicos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfil_verificador pv
    WHERE pv.user_id = auth.uid()
      AND pv.id = verificador_id
  )
  AND auth.uid() = solicitante_user_id
);
