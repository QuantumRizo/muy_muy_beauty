-- ============================================================================
-- SCRIPT 2: GENERAR DATOS HISTÓRICOS DE PRUEBA (2 MESES)
-- Basado en el esquema REAL de la base de datos.
-- ============================================================================
-- Estrategia: cada día, cada empleada se asigna a UNA sola sucursal aleatoria.
-- Luego recibe 2-3 citas en slots secuenciales (10:00, 11:00, 12:00...) para
-- evitar conflictos del trigger validar_disponibilidad_cita().

DO $$
DECLARE
  v_sucursal_id uuid;
  v_empleada_id uuid;
  v_cliente_id  uuid;
  v_servicio_id uuid;
  v_producto_id uuid;
  v_cita_id     uuid;
  v_ticket_id   uuid;
  v_turno_id    uuid;
  v_fecha       date;
  v_hora        time;
  v_total       numeric;
  v_precio      numeric;
  v_nombre_svc  text;
  v_nombre_prod text;
  v_folio       text;
  v_hora_inicio int;
  v_num_citas   int;
  v_sucursales  uuid[];
  v_empleadas   uuid[];
  v_clientes    uuid[];
  v_servicios   uuid[];
  v_productos   uuid[];
  -- Para asignar empleadas a sucursales
  v_emp_sucursal_map jsonb;
  v_assigned_suc     uuid;
  v_suc_empleadas    uuid[];
BEGIN
  -- ── Cargar catálogos ──────────────────────────────────────────────
  SELECT array_agg(id) INTO v_sucursales FROM sucursales;
  SELECT array_agg(id) INTO v_empleadas  FROM perfiles_empleadas WHERE activo = true;
  SELECT array_agg(id) INTO v_servicios  FROM servicios WHERE activo = true;
  SELECT array_agg(id) INTO v_productos  FROM productos WHERE activo = true;

  IF v_sucursales IS NULL OR v_empleadas IS NULL THEN
    RAISE EXCEPTION 'Faltan sucursales o empleadas activas.';
  END IF;
  IF v_servicios IS NULL THEN
    RAISE EXCEPTION 'No hay servicios activos.';
  END IF;

  -- ── Crear 50 clientes de prueba ───────────────────────────────────
  FOR i IN 1..50 LOOP
    INSERT INTO clientes (nombre_completo, telefono_cel, email, datos_extra)
    VALUES (
      'Cliente Prueba ' || i,
      '555' || LPAD(i::text, 7, '0'),
      'cliente' || i || '@prueba.com',
      '{"procedencia":"Instagram"}'::jsonb
    ) RETURNING id INTO v_cliente_id;
    v_clientes := array_append(v_clientes, v_cliente_id);
  END LOOP;

  -- ── Recorrer los últimos 60 días ──────────────────────────────────
  FOR d IN 0..60 LOOP
    v_fecha := CURRENT_DATE - (60 - d);

    -- Ignorar domingos
    IF EXTRACT(DOW FROM v_fecha) = 0 THEN
      CONTINUE;
    END IF;

    -- Abrir turno de caja en cada sucursal
    FOREACH v_sucursal_id IN ARRAY v_sucursales LOOP
      INSERT INTO turnos_caja (
        sucursal_id, empleada_abre_id,
        fecha_apertura, hora_apertura,
        monto_apertura_efectivo, estado
      ) VALUES (
        v_sucursal_id, v_empleadas[1],
        v_fecha, time '09:00:00',
        500, 'Abierta'
      );
    END LOOP;

    -- ── Asignar cada empleada a UNA sucursal aleatoria para este día ──
    -- Esto evita que la misma empleada tenga citas en 2 sucursales
    FOREACH v_empleada_id IN ARRAY v_empleadas LOOP
      -- 80% de probabilidad de que trabaje ese día
      IF random() > 0.8 THEN
        CONTINUE;
      END IF;

      -- Elegir una sucursal aleatoria para esta empleada hoy
      v_assigned_suc := v_sucursales[1 + floor(random() * array_length(v_sucursales, 1))::int];

      -- Buscar el turno de esa sucursal para hoy
      SELECT id INTO v_turno_id FROM turnos_caja
        WHERE sucursal_id = v_assigned_suc AND fecha_apertura = v_fecha LIMIT 1;

      -- Registrar asistencia
      INSERT INTO asistencia (sucursal_id, empleada_id, created_at)
      VALUES (v_assigned_suc, v_empleada_id, v_fecha + time '09:00:00');

      -- Generar 2-3 citas secuenciales para esta empleada
      v_num_citas   := floor(random() * 2 + 2)::int; -- 2 o 3
      v_hora_inicio := 10; -- empezar a las 10:00

      FOR slot IN 1..v_num_citas LOOP
        IF v_hora_inicio >= 18 THEN EXIT; END IF;

        v_cliente_id := v_clientes[1 + floor(random() * array_length(v_clientes, 1))::int];
        v_hora       := (LPAD(v_hora_inicio::text, 2, '0') || ':00')::time;

        -- Insertar cita (horario garantizado único por empleada)
        INSERT INTO citas (
          cliente_id, sucursal_id, empleada_id,
          fecha, bloque_inicio, duracion_manual_slots, estado
        ) VALUES (
          v_cliente_id, v_assigned_suc, v_empleada_id,
          v_fecha, v_hora, 2, 'Finalizada'
        ) RETURNING id INTO v_cita_id;

        -- Calcular total: 1-2 servicios
        v_total := 0;
        FOR j IN 1..(floor(random() * 2 + 1)::int) LOOP
          v_servicio_id := v_servicios[1 + floor(random() * array_length(v_servicios, 1))::int];
          SELECT precio, nombre INTO v_precio, v_nombre_svc FROM servicios WHERE id = v_servicio_id;
          v_total := v_total + v_precio;
          INSERT INTO cita_servicios (cita_id, servicio_id) VALUES (v_cita_id, v_servicio_id);
        END LOOP;

        -- Folio de ticket
        SELECT siguiente_folio_ticket(v_assigned_suc) INTO v_folio;

        -- Crear ticket
        INSERT INTO tickets (
          sucursal_id, cliente_id, vendedor_id,
          num_ticket, base_imponible, iva, total,
          estado, fecha, hora
        ) VALUES (
          v_assigned_suc, v_cliente_id, v_empleada_id,
          v_assigned_suc::text || '-' || v_folio,
          round(v_total / 1.16, 2),
          round(v_total - v_total / 1.16, 2),
          v_total,
          'Pagado', v_fecha, v_hora
        ) RETURNING id INTO v_ticket_id;

        -- Items del ticket (servicios)
        FOR v_servicio_id IN SELECT servicio_id FROM cita_servicios WHERE cita_id = v_cita_id LOOP
          SELECT precio, nombre INTO v_precio, v_nombre_svc FROM servicios WHERE id = v_servicio_id;
          INSERT INTO ticket_items (
            ticket_id, tipo, referencia_id, nombre,
            cantidad, precio_unitario, total, vendedor_id
          ) VALUES (
            v_ticket_id, 'Servicio', v_servicio_id, v_nombre_svc,
            1, v_precio, v_precio, v_empleada_id
          );
        END LOOP;

        -- Venta de producto (20% del tiempo)
        IF random() < 0.2 AND v_productos IS NOT NULL THEN
          v_producto_id := v_productos[1 + floor(random() * array_length(v_productos, 1))::int];
          SELECT precio, nombre INTO v_precio, v_nombre_prod FROM productos WHERE id = v_producto_id;
          INSERT INTO ticket_items (
            ticket_id, tipo, referencia_id, nombre,
            cantidad, precio_unitario, total, vendedor_id
          ) VALUES (
            v_ticket_id, 'Producto', v_producto_id, v_nombre_prod,
            1, v_precio, v_precio, v_empleada_id
          );
          UPDATE tickets
          SET total = total + v_precio,
              base_imponible = round((total + v_precio) / 1.16, 2),
              iva = round(v_precio - v_precio / 1.16, 2)
          WHERE id = v_ticket_id;
          v_total := v_total + v_precio;
        END IF;

        -- Pago
        INSERT INTO pagos (ticket_id, metodo_pago, importe, fecha, hora)
        VALUES (
          v_ticket_id,
          CASE WHEN random() > 0.5 THEN 'Efectivo'::metodo_pago
               WHEN random() > 0.5 THEN 'Tarjeta'::metodo_pago
               ELSE 'Transferencia'::metodo_pago END,
          v_total, v_fecha, v_hora
        );

        -- Avanzar al siguiente bloque horario (cada 2 horas para dar espacio)
        v_hora_inicio := v_hora_inicio + 2;

      END LOOP; -- slots por empleada
    END LOOP; -- empleadas

    -- Cerrar todos los turnos del día
    FOREACH v_sucursal_id IN ARRAY v_sucursales LOOP
      UPDATE turnos_caja
      SET estado                     = 'Cerrada',
          empleada_cierra_id         = v_empleadas[1],
          fecha_cierre               = v_fecha,
          hora_cierre                = time '19:00:00',
          monto_cierre_efectivo_real = 500,
          diferencia_efectivo        = 0
      WHERE sucursal_id = v_sucursal_id AND fecha_apertura = v_fecha;
    END LOOP;

  END LOOP; -- días

  RAISE NOTICE 'Datos históricos generados correctamente (60 días).';
END $$;
