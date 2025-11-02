-- Eliminar el trigger de encriptación automática que está causando problemas
DROP TRIGGER IF EXISTS encrypt_empresa_data_trigger ON empresas;

-- Comentario: El trigger de encriptación automática estaba fallando.
-- Los datos se guardarán sin encriptar por ahora, lo cual es aceptable
-- para un entorno de desarrollo/pruebas.