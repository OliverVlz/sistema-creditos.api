-- Script para crear la base de datos para desarrollo local
-- Ejecutar este script como superusuario de PostgreSQL (usuario postgres)

-- Verificar conexión
SELECT 'Conectado a PostgreSQL versión: ' || version() AS info;

-- Crear la base de datos si no existe
DROP DATABASE IF EXISTS sistema_creditos_dev;

-- Crear usando template0 para evitar problemas de collation
CREATE DATABASE sistema_creditos_dev
WITH
    OWNER = postgres ENCODING = 'UTF8' TEMPLATE = template0;

-- Comentario sobre la base de datos
COMMENT ON DATABASE sistema_creditos_dev IS 'Base de datos para desarrollo local del Sistema de Créditos';

-- Verificar que se creó correctamente
\l sistema_creditos_dev

-- Conectar a la nueva base de datos para verificar
\c sistema_creditos_dev

-- Crear extensiones útiles (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Mensaje de confirmación
SELECT 'Base de datos sistema_creditos_dev creada y configurada exitosamente' AS resultado;