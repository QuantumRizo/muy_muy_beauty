import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

async function run() {
  const { count: citasCount } = await supabase.from('citas').select('*', { count: 'exact', head: true });
  const { count: clientesCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
  
  // Aggregate revenue
  const { data: movimientos } = await supabase.from('movimientos_caja').select('monto').eq('tipo', 'Ingreso');
  const revenue = movimientos?.reduce((acc, curr) => acc + curr.monto, 0) || 0;
  
  // Top employees
  const { data: citas } = await supabase.from('citas').select('empleada_id, perfiles_empleadas(nombre)');
  const empCounts: Record<string, number> = {};
  citas?.forEach(c => {
    const name = c.perfiles_empleadas?.nombre || 'Desconocida';
    empCounts[name] = (empCounts[name] || 0) + 1;
  });
  const topEmp = Object.entries(empCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  
  console.log(JSON.stringify({
    citasCount,
    clientesCount,
    revenue,
    topEmp
  }, null, 2));
}

run().catch(console.error);
