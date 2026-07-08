import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup Supabase Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const generateClients = async () => {
  const { data: sucursales } = await supabase.from('sucursales').select('id');
  if (!sucursales || sucursales.length === 0) return [];

  const clients = Array.from({ length: 50 }).map((_, i) => ({
    nombre_completo: `Cliente Simulado ${i + 1}`,
    telefono_cel: `55${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: `cliente_sim_${i + 1}@example.com`,
    sucursal_id: sucursales[Math.floor(Math.random() * sucursales.length)].id,
    datos_extra: { notas: 'Generado por script de simulacion' }
  }));

  let { data: insertedClients, error } = await supabase.from('clientes').insert(clients).select('id');
  if (error) {
    console.log('Clientes ya existen, recuperando...');
    const res = await supabase.from('clientes').select('id').like('email', 'cliente_sim_%');
    insertedClients = res.data || [];
  }
  return insertedClients;
};

const simulateAppointments = async (clients: any[]) => {
  if (!clients || clients.length === 0) return;

  const { data: sucursales } = await supabase.from('sucursales').select('id');
  let { data: empleadas } = await supabase.from('perfiles_empleadas').select('id, sucursal_id').eq('activo', true);
  let { data: servicios } = await supabase.from('servicios').select('id, duracion_slots, precio').eq('activo', true);

  if (!sucursales || sucursales.length === 0) return;

  // Insert dummy services if none exist
  if (!servicios || servicios.length === 0) {
    const { data: cat } = await supabase.from('categorias_servicio').insert({ nombre: 'Simulada' }).select('id').single();
    await supabase.from('servicios').insert([
      { nombre: 'Manicura Sim', precio: 250, duracion_slots: 4, activo: true, categoria_id: cat?.id },
      { nombre: 'Pedicura Sim', precio: 300, duracion_slots: 4, activo: true, categoria_id: cat?.id }
    ]);
    const resServ = await supabase.from('servicios').select('id, duracion_slots, precio').eq('activo', true);
    servicios = resServ.data || [];
  }

  // Insert dummy employees if none exist
  if (!empleadas || empleadas.length === 0) {
    await supabase.from('perfiles_empleadas').insert([
      { nombre: 'Empleada Prueba 1', activo: true, sucursal_id: sucursales[0].id },
      { nombre: 'Empleada Prueba 2', activo: true, sucursal_id: sucursales[0].id }
    ]);
    const resEmp = await supabase.from('perfiles_empleadas').select('id, sucursal_id').eq('activo', true);
    empleadas = resEmp.data || [];
  }

  if (servicios.length === 0 || empleadas.length === 0) {
    console.error('Faltan servicios o empleadas para simular.');
    return;
  }

  const hoy = new Date();
  
  for (let d = 14; d >= 0; d--) {
    const currentDate = new Date(hoy);
    currentDate.setDate(currentDate.getDate() - d);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    for (const sucursal of sucursales) {
      const empleadasSucursal = empleadas.filter(e => e.sucursal_id === sucursal.id);
      if (empleadasSucursal.length === 0) continue;

      const numCitas = Math.floor(Math.random() * 10) + 5; // 5 to 14 appointments per day

      for (let c = 0; c < numCitas; c++) {
        const cliente = clients[Math.floor(Math.random() * clients.length)];
        const empleada = empleadasSucursal[Math.floor(Math.random() * empleadasSucursal.length)];
        
        // Random start time between 09:00 and 18:00
        const startHour = 9 + Math.floor(Math.random() * 9);
        const startMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        const bloqueInicio = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;

        // Create cita
        const { data: cita, error: errorCita } = await supabase.from('citas').insert({
          fecha: dateStr,
          bloque_inicio: bloqueInicio,
          sucursal_id: sucursal.id,
          empleada_id: empleada.id,
          cliente_id: cliente.id,
          estado: 'Finalizada',
          comentarios: 'Simulacion autogenerada'
        }).select('id').single();

        if (errorCita || !cita) {
          console.error('Error insertando cita:', errorCita);
          continue;
        }

        // Add 1 to 3 services
        const numServices = Math.floor(Math.random() * 3) + 1;
        const selectedServices = [];
        for (let s = 0; s < numServices; s++) {
          selectedServices.push(servicios[Math.floor(Math.random() * servicios.length)]);
        }

        // Insert cita_servicios
        const citaServiciosInserts = selectedServices.map(s => ({
          cita_id: cita.id,
          servicio_id: s.id
        }));

        await supabase.from('cita_servicios').insert(citaServiciosInserts);

        // Generate tickets if it's Finalizada
        const totalPrice = selectedServices.reduce((acc, s) => acc + s.precio, 0);
        
        // Ensure there is a ticket for it
        const { data: ticket, error: ticketError } = await supabase.from('tickets').insert({
          sucursal_id: sucursal.id,
          cliente_id: cliente.id,
          empleada_id: empleada.id,
          fecha: dateStr,
          hora: bloqueInicio,
          total: totalPrice,
          subtotal: totalPrice,
          metodo_pago: 'Efectivo',
          estado: 'Completado'
        }).select('id').single();

        if (ticket) {
          // Add to pagos
          await supabase.from('pagos').insert({
            ticket_id: ticket.id,
            importe: totalPrice,
            metodo_pago: 'Efectivo',
            fecha: dateStr,
            hora: bloqueInicio
          });
        }
      }
    }
  }
};

const run = async () => {
  console.log('Iniciando simulacion...');
  const clients = await generateClients();
  console.log(`Clientes generados: ${clients.length}`);
  
  await simulateAppointments(clients);
  console.log('Citas simuladas exitosamente.');
};

run().catch(console.error);
