-- Eliminar foreign key antigua que apunta a tabla reclutadores (vacía)
ALTER TABLE public.vacantes 
DROP CONSTRAINT IF EXISTS vacantes_reclutador_id_fkey;

-- Crear nueva foreign key apuntando a perfil_reclutador
ALTER TABLE public.vacantes 
ADD CONSTRAINT vacantes_reclutador_id_fkey 
FOREIGN KEY (reclutador_id) 
REFERENCES perfil_reclutador(id) 
ON DELETE SET NULL;