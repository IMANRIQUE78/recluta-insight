-- Temporalmente eliminar la foreign key constraint
ALTER TABLE perfil_usuario DROP CONSTRAINT IF EXISTS perfil_usuario_user_id_fkey;

-- Insertar 10 usuarios de prueba en perfil_usuario
INSERT INTO perfil_usuario (user_id, nombre_usuario, pais, nombre_empresa, tipo_usuario, tamano_empresa, mostrar_empresa_publica) VALUES
('11111111-1111-1111-1111-111111111111', 'Carlos Rodríguez', 'México', 'TechCorp México', 'profesional_rrhh', 'grande', true),
('22222222-2222-2222-2222-222222222222', 'María González', 'Colombia', 'Innovatech Colombia', 'profesional_rrhh', 'mediana', true),
('33333333-3333-3333-3333-333333333333', 'Juan Martínez', 'Argentina', 'StartupHub Buenos Aires', 'dueno_direccion', 'pyme', true),
('44444444-4444-4444-4444-444444444444', 'Ana López', 'Chile', 'Global Recruitment Chile', 'profesional_rrhh', 'grande', true),
('55555555-5555-5555-5555-555555555555', 'Pedro Sánchez', 'Perú', 'HR Solutions Perú', 'profesional_rrhh', 'mediana', true),
('66666666-6666-6666-6666-666666666666', 'Laura Fernández', 'España', 'European Talent Group', 'dueno_direccion', 'grande', true),
('77777777-7777-7777-7777-777777777777', 'Miguel Torres', 'México', 'Startup México DF', 'profesional_rrhh', 'pyme', true),
('88888888-8888-8888-8888-888888888888', 'Sofia Ramírez', 'Colombia', 'Tech Talent Colombia', 'dueno_direccion', 'mediana', true),
('99999999-9999-9999-9999-999999999999', 'Diego Vargas', 'Argentina', 'Empresa Confidencial', 'profesional_rrhh', 'grande', false),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valentina Silva', 'Brasil', 'RH Brasil Consultoria', 'profesional_rrhh', 'mediana', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insertar estadísticas para los 10 usuarios
INSERT INTO estadisticas_reclutador (user_id, vacantes_cerradas, promedio_dias_cierre, ranking_score) VALUES
('11111111-1111-1111-1111-111111111111', 45, 22.5, 950),
('22222222-2222-2222-2222-222222222222', 38, 28.3, 850),
('33333333-3333-3333-3333-333333333333', 52, 18.7, 1050),
('44444444-4444-4444-4444-444444444444', 41, 25.1, 900),
('55555555-5555-5555-5555-555555555555', 29, 31.2, 750),
('66666666-6666-6666-6666-666666666666', 47, 20.9, 980),
('77777777-7777-7777-7777-777777777777', 15, 35.6, 600),
('88888888-8888-8888-8888-888888888888', 33, 27.8, 820),
('99999999-9999-9999-9999-999999999999', 50, 19.4, 1020),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 36, 26.5, 870)
ON CONFLICT (user_id) DO NOTHING;