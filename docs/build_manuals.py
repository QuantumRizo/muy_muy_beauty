import os

def build_empleado_manual():
    content = """<div class="cover-page">
  <img src="img/logo.jpeg" alt="MUYMUY Logo" width="180" style="border:none; box-shadow:none; margin-bottom: 20px;">
  <h1 class="cover-title">Manual de Operación de Sucursal</h1>
  <div class="cover-subtitle">Rol: Empleado / Recepción y Caja</div>
  <div class="cover-date">Última actualización: Junio 2026</div>
</div>

<div class="page-break"></div>

# Introducción al Sistema

Bienvenida al sistema de gestión de **MUYMUY Beauty Studio**. Este manual práctico te guiará paso a paso en tus tareas diarias para garantizar una operación fluida, un cobro correcto y un control preciso de la asistencia y la caja de tu sucursal.

Como **Empleado**, tu cuenta tiene las siguientes características de seguridad y operación:
- **Restricción de Sucursal:** Tu vista está bloqueada automáticamente a la sucursal a la que estás asignada. No es necesario seleccionar o cambiar de sucursal; el sistema lo gestiona por ti.
- **Acceso Limitado:** Solo verás las pestañas operativas. Las métricas avanzadas y configuraciones globales quedan reservadas para administración.

A continuación, explicamos cada sección tal como aparecen en tu menú lateral:

---

# 1. Agenda

La agenda es la pantalla principal del estudio. En ella visualizarás las citas asignadas a cada profesional divididas por columnas y rangos de 15 minutos.

![Agenda Principal](img/agenda_principal.png)

## 1.1 Agendar una Cita Nueva
Agendar una cita requiere de dos pasos sencillos para asegurar que no se dupliquen clientes y que los datos sean correctos:

### Paso 1: Búsqueda del Cliente
Al hacer clic en cualquier espacio libre de la agenda (debajo de la columna de la profesional y en la hora deseada), se abrirá automáticamente el buscador.
- Escribe el nombre, teléfono o ID del cliente para buscarlo en la base de datos.
- Si el cliente ya existe, haz clic sobre su nombre para pasar al formulario.
- Si es un cliente nuevo, presiona el botón **Nuevo cliente** para registrar sus datos básicos antes de continuar.

![Buscar Cliente](img/buscar_cliente.png)

<div class="page-break"></div>

### Paso 2: Detalles de la Cita
Una vez seleccionado el cliente, se cargará el formulario de reserva:
- **Servicios:** Selecciona los servicios que solicita el cliente.
- **Hora y Fecha:** Confirma que el horario asignado sea el correcto.
- **Notas:** Añade observaciones importantes si el cliente tiene alguna preferencia.
- Presiona **Crear Cita** para guardarla en la agenda.

![Detalles de la Cita](img/nueva_cita.png)

## 1.2 Cobro de Citas (Validación)
Las citas se cobran **únicamente** desde la agenda, mediante el proceso de validación.

1. **Validar Servicios:** Cuando un cliente finalice, haz clic en su cita y selecciona **Validar**. Verifica que los servicios cobrados correspondan a lo realizado. Puedes ajustar la hora real de inicio/fin o cambiar la profesional.
   ![Validación de Servicios](img/validar_cobro.png)
2. **Checkout de la Cita:** Pasarás a la pantalla de Checkout.
   - Si compró productos extras, presiona **+ Producto**.
   - Si deja propina o aplicas descuento, presiona **+ Propina** o **% Dcto.**.
3. **Registrar el Pago:** Selecciona el **Método de pago** e ingresa el importe entregado por el cliente. Presiona **Confirmar pago**.
   ![Modal de Pago](img/pago_modal.png)

> [!TIP]
> **¿Cometiste un error al registrar el pago?** Puedes hacer clic en el **icono de la papelera (basura)** al lado del pago agregado para eliminarlo y registrarlo de nuevo antes de cerrar la venta.

---

# 2. Clientes

En esta sección tienes acceso al directorio de clientes que han visitado la sucursal.
- Puedes utilizar la barra de búsqueda superior para encontrar rápidamente a cualquier cliente por nombre, teléfono o correo.
- Selecciona el perfil del cliente para ver su historial de servicios y notas.

---

<div class="page-break"></div>

# 3. Asistencia

Llevar un registro preciso de las horas de entrada y salida es fundamental para el cálculo correcto de tu nómina y puntualidad.

### Cómo registrar tu entrada y salida:
1. Dirígete al panel de **Asistencia** en el menú lateral.
2. Selecciona tu nombre en la lista de profesionales.
3. Presiona el botón **Registrar Entrada** (al inicio del día) o **Registrar Salida** (al finalizar la jornada).

![Panel de Asistencia](img/asistencia.png)

> [!IMPORTANT]
> **Tolerancia y Estatus "Sin Entrada" (S/E):**
> Existe un período de tolerancia de **10 minutos** a partir de la hora de apertura. Si no registras tu entrada a tiempo, aparecerás automáticamente con la etiqueta **"S/E" (Sin Entrada)** en la agenda, lo cual afectará tus métricas de asistencia.

---

# 4. Venta Directa

Si un cliente entra a la sucursal **solo a comprar un producto** (sin tener cita en la agenda), debes usar esta pestaña.

1. Selecciona opcionalmente al cliente en el buscador y la profesional que realizó la venta.
2. Haz clic en **Añadir Producto** y selecciona lo que el cliente va a llevar.
3. Presiona **Añadir pago**, selecciona el método e ingresa el importe.
4. Haz clic en **Cerrar Venta** para imprimir el ticket.

---

<div class="page-break"></div>

# 5. Caja

El control de la sucursal comienza abriendo el turno y finaliza cerrándolo desde esta pestaña.

## Apertura de Caja (Al inicio del día)
Al iniciar el día, debes declarar el efectivo inicial (fondo fijo) que recibes en el cajón de dinero.
1. Selecciona tu nombre en *¿Quién abre la caja?*.
2. Digita el importe exacto del **Fondo inicial (Efectivo)** y presiona **Abrir Turno de Caja**.

![Abrir Caja](img/abrir_caja.png)

## Cierre de Caja (Al final del día)
Al terminar el día de trabajo, debes hacer el corte y declarar el dinero real que dejas en el cajón.
1. Haz clic en **Cerrar Caja**.
2. Cuenta detalladamente el efectivo físico en el cajón y digita el monto en **¿Cuánto efectivo real hay en caja?**.
3. El sistema te mostrará la diferencia en color rojo (si falta) o verde (si sobra). Agrega notas si es necesario y haz clic en **Confirmar Cierre**.

![Cerrar Caja](img/cerrar_caja.png)

---

# 6. Vacaciones

Desde esta sección puedes solicitar directamente tus días de vacaciones al área de administración y consultar el estado de tus solicitudes.

1. **Nueva Solicitud:** Haz clic en el botón superior para crear una nueva petición. Selecciona tu nombre, la fecha de inicio y la fecha de fin. El sistema calculará automáticamente los días hábiles. Puedes agregar una nota (ej: "Vacaciones de verano") y enviar la solicitud.
2. **Estado de Solicitud:** Tus peticiones aparecerán listadas con una etiqueta de color:
   - <span style="color: #F59E0B; font-weight: bold;">Pendiente</span> (En revisión por administración).
   - <span style="color: #10B981; font-weight: bold;">Aprobada</span> (Tus días ya fueron bloqueados en la agenda).
   - <span style="color: #EF4444; font-weight: bold;">Rechazada</span> (Puedes leer la nota de rechazo del administrador).
3. **Solicitar Extensión:** Si ya tienes una solicitud aprobada y necesitas más días, puedes presionar **"Solicitar extensión"** directamente sobre esa tarjeta.

![Vacaciones Empleado](img/vacaciones_empleado.png)

"""
    with open('/Users/david/Projects/muy_muy_beauty/docs/manual_empleados.md', 'w', encoding='utf-8') as f:
        f.write(content)

def build_admin_manual():
    content = """<div class="cover-page">
  <img src="img/logo.jpeg" alt="MUYMUY Logo" width="180" style="border:none; box-shadow:none; margin-bottom: 20px;">
  <h1 class="cover-title">Manual de Administración del Sistema</h1>
  <div class="cover-subtitle">Rol: Administrador / Superadmin</div>
  <div class="cover-date">Última actualización: Junio 2026</div>
</div>

<div class="page-break"></div>

# Introducción para Administradores

Como **Administrador** de **MUYMUY Beauty Studio**, posees privilegios elevados dentro del sistema que te otorgan visibilidad y control sobre todas las operaciones de las sucursales.
A diferencia del rol de Empleado, puedes cambiar de sucursal en tiempo real usando el selector ubicado en el menú lateral o en la cabecera. La información de toda la aplicación se ajustará automáticamente a la sucursal seleccionada.

A continuación, se detalla el funcionamiento de cada módulo, ordenado **exactamente como aparece en el menú lateral**.

---

# 1. Inicio (Dashboard Principal)

El **Dashboard Principal** te permite monitorear el rendimiento general del negocio al instante. Al entrar al sistema, verás métricas clave que resumen la salud financiera y operativa.

![Dashboard de Métricas](img/dashboard_metricas.png)

Desde esta pantalla puedes:
- **Filtrar por Sucursal y Fecha:** Cambiar entre vistas de "Hoy", "Semana" o "Mes" para todas las sucursales combinadas o una en específico.
- **Visualizar Ingresos y KPI:** Monitorear ingresos totales, ticket promedio, tasa de retención de clientes y diferencias de caja.
- **Gráficos de Tendencias:** Observar cómo se comportan los ingresos y qué servicios son los más solicitados.

---

# 2. Agenda

La agenda es la pantalla principal operativa. 
Como administrador, si necesitas realizar un **Bloqueo Masivo** (cerrar la sucursal por un evento, remodelación o día festivo), puedes presionar el botón "Bloqueo Masivo" en la esquina superior de la agenda, seleccionar las fechas, y el sistema automáticamente bloqueará todas las columnas de la sucursal seleccionada para evitar que se puedan agendar citas.

![Bloqueo Masivo](img/bloqueo_masivo.png)

---

# 3. Clientes

Directorio general de clientes. Puedes exportar la base de datos o revisar historiales completos desde esta sección para futuras estrategias comerciales.

---

# 4. Asistencia

Visualiza los registros de entrada y salida de todo el personal de la sucursal seleccionada. Aquí puedes monitorear quiénes tienen el estatus "S/E" (Sin Entrada) por llegar tarde o ausentarse.

---

# 5. Venta Directa

Módulo operativo (generalmente usado por recepción) para ventas de mostrador de productos sin cita previa. Puedes monitorear las transacciones activas.

---

# 6. Caja

Auditoría en vivo del turno operativo de la caja. Puedes ver a qué hora se abrió el turno, por quién, y qué movimientos (ingresos y gastos) se han registrado.

---

<div class="page-break"></div>

# 7. Vacaciones

Módulo central para la autorización y denegación de solicitudes de vacaciones del personal. Cada vez que una empleada haga una petición, aparecerá aquí con estatus <span style="color: #F59E0B; font-weight: bold;">Pendiente</span>.

![Vacaciones Admin](img/vacaciones_admin.png)

### Flujo de Aprobación:
1. **Revisar Solicitud:** Verás el nombre de la empleada, las fechas solicitadas, y la cantidad de días hábiles que representan.
2. **Tomar Acción:** Al presionar "Aprobar" o "Rechazar", se abrirá un modal.
3. **Bloqueo Automático:** Si apruebas la solicitud, el sistema **bloqueará automáticamente la agenda** de esa profesional durante esos días, asegurando que nadie pueda agendarle una cita por accidente. Puedes agregar una nota (ej: "Aprobado, disfruta tu viaje") que ella podrá leer.

---

<div class="page-break"></div>

# 8. Análisis (Centro de Análisis)

El **Centro de Análisis** es tu panel financiero y de reportes profundos.

![Centro de Análisis](img/centro_analisis.png)

Este centro se divide en tres pestañas principales de trabajo:

## 8.1 Ventas y Cajas
Es la pestaña operativa para auditar transacciones.
- **Listado de Ventas:** Inspeccionar todos los tickets cobrados, buscar por código de ticket o cliente, y exportar resúmenes en CSV.
- **Pagos Aplazados:** Muestra clientes con estatus "Pendiente" de pago.
- **Buscador de Cajas:** Permite realizar auditorías sobre las aperturas y cierres de los cajones de dinero históricos. Si hubo un desfase, se verá resaltado en rojo o verde.

## 8.2 Estadísticas y Reportes
Aquí puedes consultar más de 20 indicadores clave (KPIs) agrupados por: Clientes (nuevos vs recurrentes, procedencia), Servicios (los más vendidos, tiempo promedio), Agenda (Tasa de inasistencias o No-Shows) y Facturación Neta.

## 8.3 Desempeño y Comisiones
La tabla automatizada de cálculo de nómina variable.
El sistema genera el cálculo quincenal o mensual sumando los servicios realizados y aplicando el porcentaje configurado para la empleada. Puedes exportar esta información directamente a Excel para el pago de nómina.

---

<div class="page-break"></div>

# 9. Administración

El Panel de Configuración General, de acceso exclusivo para administradores.

![Staff y Comisiones](img/administracion_staff.png)

## 9.1 Sucursales y Staff
- **Personal y Perfiles:** Desde la sub-pestaña de Empleadas puedes agregar o desactivar personal, asignarles sucursal, cambiar su rol y configurar su nivel de acceso. **Nota:** Para crear perfiles nuevos puedes hacerlo tú o contactar a IT (David Rizo) si requieres ayuda.
- **Esquemas de Comisión:** Cada empleada puede tener un esquema de comisión diferente y sueldo base. Puedes modificar esto libremente; se aplicará a los próximos servicios que realicen.

## 9.2 Seguridad
Auditoría técnica del sistema para rastrear accesos, creación de perfiles y borrado de información sensible (por si sospechas de alguna actividad inusual).

## 9.3 Documentos
Un repositorio digital para subir manuales, actas o documentos operativos importantes para que estén centralizados.

---

# 10. Inventario

Control total de productos. Puedes visualizar el catálogo, ver el nivel de stock en tiempo real para cada sucursal, e ingresar remisiones para actualizar los niveles de unidades disponibles de cada producto o cabina extra.

![Inventario](img/inventario.png)

---

# 11. Marketing

Módulo para exportación y fidelización. Utiliza el filtro de clientes para extraer listas de contactos que cumplen con ciertos criterios (ej: clientes que no han venido en 3 meses, o que gastan más de $2000) y descárgalos en CSV para cargarlos en tus herramientas de Email Marketing o WhatsApp.

![Marketing](img/marketing_filtros.png)

"""
    with open('/Users/david/Projects/muy_muy_beauty/docs/manual_administradores.md', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    build_empleado_manual()
    build_admin_manual()
    print("Manuales regenerados con éxito.")
