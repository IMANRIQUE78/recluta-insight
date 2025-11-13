-- Agregar foreign key entre postulaciones y perfil_candidato
-- Esto permitirá que Supabase pueda hacer joins automáticos entre estas tablas

ALTER TABLE public.postulaciones
ADD CONSTRAINT postulaciones_candidato_user_id_fkey 
FOREIGN KEY (candidato_user_id) 
REFERENCES public.perfil_candidato(user_id) 
ON DELETE CASCADE;