-- Crear bucket para CVs de candidatos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-cvs', 
  'candidate-cvs', 
  false,
  5242880, -- 5MB en bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Política: Candidatos pueden subir su propio CV (carpeta con su user_id)
CREATE POLICY "Candidatos pueden subir su CV"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Candidatos pueden ver/descargar su propio CV
CREATE POLICY "Candidatos pueden ver su CV"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'candidate-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Candidatos pueden actualizar su CV
CREATE POLICY "Candidatos pueden actualizar su CV"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'candidate-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Candidatos pueden eliminar su CV
CREATE POLICY "Candidatos pueden eliminar su CV"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'candidate-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política: Reclutadores con acceso desbloqueado pueden ver/descargar CV del candidato
CREATE POLICY "Reclutadores con acceso pueden ver CV"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'candidate-cvs' 
  AND EXISTS (
    SELECT 1 FROM acceso_identidad_candidato aic
    JOIN perfil_reclutador pr ON pr.id = aic.reclutador_id
    WHERE pr.user_id = auth.uid()
    AND aic.candidato_user_id = (storage.foldername(name))[1]::uuid
  )
);

-- Agregar columna para URL del CV en perfil_candidato
ALTER TABLE public.perfil_candidato
ADD COLUMN IF NOT EXISTS cv_url TEXT DEFAULT NULL;

-- Agregar columna para nombre original del archivo
ALTER TABLE public.perfil_candidato
ADD COLUMN IF NOT EXISTS cv_filename TEXT DEFAULT NULL;