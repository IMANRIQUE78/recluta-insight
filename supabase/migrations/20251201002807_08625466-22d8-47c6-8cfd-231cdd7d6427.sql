-- Actualizar todas las suscripciones de empresas existentes a plan enterprise (premium) temporalmente
-- Esto es una bandera temporal mientras se implementa el sistema de pagos real
UPDATE suscripcion_empresa 
SET plan = 'enterprise'
WHERE activa = true;

-- Insertar suscripciones enterprise (premium) para empresas que no tengan suscripción
INSERT INTO suscripcion_empresa (empresa_id, plan, activa)
SELECT e.id, 'enterprise'::plan_empresa, true
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM suscripcion_empresa se WHERE se.empresa_id = e.id
);