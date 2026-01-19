-- Migración de limpieza: Eliminar tablas obsoletas
-- Fecha: 2026-01-19
-- Razón: Estas tablas ya no se utilizan en el flujo de la aplicación

-- 1. estadisticas_reclutador - Reemplazada por cálculos dinámicos en useReclutadorStats.tsx
DROP TABLE IF EXISTS public.estadisticas_reclutador CASCADE;

-- 2. auditoria_acceso_empresas - Tabla de log sin uso real desde el frontend
DROP TABLE IF EXISTS public.auditoria_acceso_empresas CASCADE;

-- 3. asignacion_creditos - Redundante con el sistema de créditos heredados
DROP TABLE IF EXISTS public.asignacion_creditos CASCADE;

-- También eliminar la función asociada que ya no será necesaria
DROP FUNCTION IF EXISTS public.recalcular_estadisticas_reclutador(uuid) CASCADE;