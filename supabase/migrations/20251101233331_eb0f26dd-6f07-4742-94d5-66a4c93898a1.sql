-- Remove años de experiencia and nivel de seniority from perfil_candidato
ALTER TABLE perfil_candidato 
DROP COLUMN IF EXISTS anos_experiencia,
DROP COLUMN IF EXISTS nivel_seniority;