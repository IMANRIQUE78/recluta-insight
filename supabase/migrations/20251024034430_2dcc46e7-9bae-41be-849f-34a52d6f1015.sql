-- Agregar campos necesarios para el flujo de agendamiento de entrevistas
ALTER TABLE entrevistas_candidato
ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'propuesta',
ADD COLUMN IF NOT EXISTS detalles_reunion text,
ADD COLUMN IF NOT EXISTS reclutador_user_id uuid,
ADD COLUMN IF NOT EXISTS motivo_rechazo text;

-- Agregar comentarios para documentar los valores posibles
COMMENT ON COLUMN entrevistas_candidato.estado IS 'Estados: propuesta, aceptada, rechazada, completada, cancelada';
COMMENT ON COLUMN entrevistas_candidato.tipo_entrevista IS 'Tipos: virtual, presencial, telefonica';

-- Agregar RLS policies para que reclutadores puedan crear propuestas de entrevistas
CREATE POLICY "Los reclutadores pueden crear entrevistas para sus vacantes"
ON entrevistas_candidato
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pm.user_id = auth.uid()
  )
);

-- Permitir a reclutadores actualizar las entrevistas que crearon
CREATE POLICY "Los reclutadores pueden actualizar entrevistas de sus vacantes"
ON entrevistas_candidato
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pm.user_id = auth.uid()
  )
);

-- Permitir a reclutadores ver las entrevistas de sus vacantes
CREATE POLICY "Los reclutadores pueden ver entrevistas de sus vacantes"
ON entrevistas_candidato
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM postulaciones p
    JOIN publicaciones_marketplace pm ON p.publicacion_id = pm.id
    WHERE p.id = entrevistas_candidato.postulacion_id
    AND pm.user_id = auth.uid()
  )
);