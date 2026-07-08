import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

async function runTest() {
  console.log('--- INICIANDO PRUEBA CROSS-BRANCH ---');

  // 1. Obtener dos sucursales distintas
  const { data: sucursales } = await supabase.from('sucursales').select('id, nombre').limit(2);
  if (!sucursales || sucursales.length < 2) {
    console.error('No hay suficientes sucursales para hacer la prueba');
    return;
  }
  const sucursalA = sucursales[0];
  const sucursalB = sucursales[1];
  console.log(`Sucursal A (donde ocurre la venta): ${sucursalA.nombre}`);
  console.log(`Sucursal B (de donde viene la empleada): ${sucursalB.nombre}`);

  // 2. Obtener una empleada de la sucursal B
  const { data: empleadas } = await supabase.from('perfiles_empleadas').select('id, nombre, sucursal_id').eq('sucursal_id', sucursalB.id).limit(1);
  if (!empleadas || empleadas.length === 0) {
    console.error('No hay empleadas en la sucursal B');
    return;
  }
  const empleadaForanea = empleadas[0];
  console.log(`Empleada foránea seleccionada: ${empleadaForanea.nombre}`);

  // 3. Crear un ticket en la sucursal A, con la empleada B como vendedora
  const ticketId = crypto.randomUUID();
  console.log('Intentando crear ticket...');
  
  const { error: ticketError } = await supabase.from('tickets').insert({
    id: ticketId,
    num_ticket: 'TEST-CROSS-001',
    sucursal_id: sucursalA.id, // Venta en A
    vendedor_id: empleadaForanea.id, // Vendedora de B
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    base_imponible: 100,
    iva: 16,
    total: 116,
    estado: 'Pagado'
  });

  if (ticketError) {
    console.error('❌ FALLO en Ticket (¿RLS o Constraint?):', ticketError.message);
    return;
  }
  console.log('✅ Ticket creado exitosamente');

  // 4. Crear un item del ticket asignado a la empleada foránea
  console.log('Intentando insertar item de ticket (comisión para la empleada foránea)...');
  const { error: itemError } = await supabase.from('ticket_items').insert({
    ticket_id: ticketId,
    tipo: 'Producto',
    nombre: 'Producto de prueba',
    cantidad: 1,
    precio_unitario: 116,
    iva_porcentaje: 16,
    total: 116,
    vendedor_id: empleadaForanea.id,
    vendedor_nombre: empleadaForanea.nombre
  });

  if (itemError) {
    console.error('❌ FALLO en Item:', itemError.message);
    return;
  }
  console.log('✅ Item insertado exitosamente');
  
  // Limpieza
  await supabase.from('tickets').delete().eq('id', ticketId);
  console.log('✅ Limpieza completada. PRUEBA SUPERADA CON ÉXITO.');
}

runTest().catch(console.error);
