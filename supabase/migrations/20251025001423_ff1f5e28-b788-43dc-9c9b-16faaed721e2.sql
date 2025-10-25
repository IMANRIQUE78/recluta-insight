-- Agregar foreign key constraint entre entrevistas_candidato y postulaciones
ALTER TABLE entrevistas_candidato
ADD CONSTRAINT entrevistas_candidato_postulacion_id_fkey 
FOREIGN KEY (postulacion_id) 
REFERENCES postulaciones(id) 
ON DELETE CASCADE;