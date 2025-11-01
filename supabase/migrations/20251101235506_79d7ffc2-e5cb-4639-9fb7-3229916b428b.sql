-- Limpieza de tablas obsoletas del sistema antiguo
-- IMPORTANTE: Esto eliminará TODOS los datos de estas tablas

-- Primero eliminar las tablas que ya no se usan
DROP TABLE IF EXISTS public.candidatos CASCADE;
DROP TABLE IF EXISTS public.reclutadores CASCADE;
DROP TABLE IF EXISTS public.eventos_proceso CASCADE;
DROP TABLE IF EXISTS public.satisfaccion CASCADE;
DROP TABLE IF EXISTS public.rotacion CASCADE;
DROP TABLE IF EXISTS public.costos CASCADE;

-- Eliminar enums obsoletos
DROP TYPE IF EXISTS public.etapa_proceso CASCADE;
DROP TYPE IF EXISTS public.fuente_candidato CASCADE;

-- Opcional: Limpiar datos de prueba de tablas activas
-- DESCOMENTAR SOLO SI QUIERES BORRAR TODOS LOS DATOS
-- TRUNCATE TABLE public.mensajes_postulacion CASCADE;
-- TRUNCATE TABLE public.feedback_candidato CASCADE;
-- TRUNCATE TABLE public.entrevistas_candidato CASCADE;
-- TRUNCATE TABLE public.postulaciones CASCADE;
-- TRUNCATE TABLE public.publicaciones_marketplace CASCADE;
-- TRUNCATE TABLE public.perfil_candidato CASCADE;
-- TRUNCATE TABLE public.estadisticas_reclutador CASCADE;
-- TRUNCATE TABLE public.invitaciones_reclutador CASCADE;
-- TRUNCATE TABLE public.reclutador_empresa CASCADE;
-- TRUNCATE TABLE public.perfil_reclutador CASCADE;
-- TRUNCATE TABLE public.suscripcion_reclutador CASCADE;
-- TRUNCATE TABLE public.suscripcion_empresa CASCADE;
-- TRUNCATE TABLE public.auditoria_vacantes CASCADE;
-- TRUNCATE TABLE public.vacantes CASCADE;
-- TRUNCATE TABLE public.clientes_areas CASCADE;
-- TRUNCATE TABLE public.empresas CASCADE;
-- TRUNCATE TABLE public.perfil_usuario CASCADE;
-- TRUNCATE TABLE public.user_roles CASCADE;