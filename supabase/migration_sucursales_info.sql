-- 1. Agregar columnas a la tabla sucursales si no existen
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS rfc TEXT;

-- 2. Actualizar la información de las sucursales existentes
-- Nota: Usamos el nombre para identificar, asumiendo que coinciden con los que tienes en BD.

-- Newton
UPDATE sucursales 
SET direccion = 'Av. Isaac Newton 215, Polanco, Polanco V Secc, Miguel Hidalgo, 11560 Ciudad de México, CDMX',
    telefono = '56 1901 1318',
    rfc = 'GSE120523BI9'
WHERE nombre ILIKE '%Newton%';

-- Campos Elíseos
UPDATE sucursales 
SET direccion = 'Campos Elíseos 169, Polanco, Polanco V Secc, Miguel Hidalgo, 11580 Ciudad de México, CDMX',
    telefono = '55 4453 3065',
    rfc = 'CBE211202HRA'
WHERE nombre ILIKE '%Campos%' OR nombre ILIKE '%Eliseos%';

-- Euler
UPDATE sucursales 
SET direccion = 'Euler 152, Chapultepec Morales, Polanco V Secc, Miguel Hidalgo, 11550 Ciudad de México, CDMX',
    telefono = '55 4939 5929',
    rfc = 'CBE211202HRA'
WHERE nombre ILIKE '%Euler%';

-- Homero
UPDATE sucursales 
SET direccion = 'Av. Homero 1629, Polanco, Polanco I Secc, Miguel Hidalgo, 11510 Ciudad de México, CDMX',
    telefono = '55 2703 2830',
    rfc = 'CBE211202HRA'
WHERE nombre ILIKE '%Homero%';
