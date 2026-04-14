import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY // O la SERVICE_ROLE si la tienes, para más detalle
);

async function inspectSchema() {
  console.log('--- ESTRUCTURA DE LA BASE DE DATOS ---\n');

  const { data: tables, error: tableError } = await supabase.rpc('get_tables_info');

  // Si no tenemos la función RPC, usamos una consulta directa al information_schema
  // Nota: Para esto necesitamos permiso, o usar la service_role_key.
  // Como alternativa, intentaremos una consulta SQL simple:
  
  const { data, error } = await supabase
    .from('_info_schema_query') // Esto fallará si no existe, así que usaremos un truco de JS
    .select('*')
    .limit(1);

  console.log('Intentando obtener tablas via SQL directo...');
  
  // Como el cliente de JS está limitado, lo más fácil es que me pegues aquí 
  // el resultado de esta consulta en el SQL Editor de Supabase:
  
  const query = `
    SELECT 
      table_name, 
      column_name, 
      data_type 
    FROM 
      information_schema.columns 
    WHERE 
      table_schema = 'public'
    ORDER BY 
      table_name, ordinal_position;
  `;
  
  console.log('Copia y pega este SQL en tu editor de Supabase (Dashboard > SQL Editor):');
  console.log('\x1b[32m%s\x1b[0m', query);
  console.log('\nLuego pégame aquí el resultado que te devuelva.');
}

inspectSchema();
