<div class="cover-page">
  <img src="img/logo.jpeg" alt="MUYMUY Logo" width="180" style="border:none; box-shadow:none; margin-bottom: 20px;">
  <h1 class="cover-title">Manual de Administración del Sistema</h1>
  <div class="cover-subtitle">Rol: Administrador / Superadmin</div>
  <div class="cover-date">Última actualización: Junio 2026</div>
</div>

<div class="page-break"></div>

# 1. Introducción para Administradores

Como **Administrador** de **MUYMUY Beauty Studio**, posees privilegios elevados dentro del sistema que te otorgan visibilidad y control sobre todas las operaciones de las sucursales.

A diferencia del rol de Empleado, tu cuenta cuenta con facultades exclusivas:
- **Multisucursal:** Puedes cambiar de sucursal en tiempo real usando el selector ubicado en el menú lateral o en la cabecera. La información de la agenda, la caja activa y el inventario se ajustará automáticamente a la sucursal seleccionada.
- **Acceso a Reportes Financieros:** Tienes acceso exclusivo al **Centro de Análisis** (para ver ventas, reportes y comisiones) y a la pestaña de **Administración** e **Inventario**.

---

# 2. Centro de Análisis

El **Centro de Análisis** es tu panel financiero y de control. Aquí se consolida y procesa toda la información comercial de las sucursales en tiempo real.

![Centro de Análisis](img/dashboard_metricas.png)

Este centro se divide en tres pestañas principales de trabajo:

---

## 2.1 Ventas y Cajas
Es la pestaña operativa para auditar las transacciones diarias y verificar los cierres de caja. Cuenta con tres sub-pestañas internas:

### A) Listado de Ventas
Permite visualizar e inspeccionar detalladamente todos los tickets cobrados en el sistema.
- **Filtros de Búsqueda:** Puedes acotar los resultados usando un **Rango de Fechas** (Fecha Inicial y Fecha Final) y seleccionando una **Sucursal** específica (o elegir *"Todas las sucursales"* para una visión global).
- **Acciones Disponibles:**
  - **Buscar:** Recarga y actualiza los registros en base a tus filtros.
  - **Resumen:** Descarga un reporte en formato CSV con el consolidado monetario de ingresos netos agrupados por sucursal.
- **Columnas de la Tabla:**
  - **Nº Venta:** El código del ticket o los primeros 8 caracteres de la transacción en la base de datos (ej: `TKT-12345` o `6C5BD3D`).
  - **Fecha:** Fecha exacta de registro del ticket en formato `DD/MM/AAAA`.
  - **Cliente:** Nombre completo del cliente registrado o *"Cliente General"* si fue una venta rápida directa.
  - **Total:** Monto total facturado en pesos mexicanos (MXN).
  - **Estado:** Mostrará el icono de candado verde junto con la palabra *"Cerrada"* para confirmar que el cobro fue completado de forma definitiva.

### B) Pagos Aplazados
Muestra un listado en tiempo real de los tickets con estatus **"Pendiente"** (deudores activos).
- **Cálculo de Deuda:** El sistema calcula de manera dinámica el saldo adeudado mediante la fórmula: `Monto Pendiente = Total del Ticket - Suma de Abonos/Pagos Parciales Registrados`.
- **Datos Mostrados:** Sucursal (Centro), Nº Fact/Ticket, Fecha de compra, Nombre del Cliente, Total de la venta y el **Monto Pendiente** en color rojo (alertando sobre el saldo que el cliente debe liquidar).

### C) Buscador de Cajas (Auditoría de Turnos)
Permite realizar auditorías históricas sobre las aperturas y cierres de los cajones de dinero.
- **Datos Mostrados:**
  - **Fecha y Hora de Apertura:** Cuándo inició el turno y el nombre de la empleada responsable de la apertura.
  - **Clínica/Sucursal:** Ubicación física de la caja.
  - **Facturado (Ventas):** Suma total de las ventas registradas por la sucursal durante el turno de caja (Efectivo + Tarjeta + Otros métodos).
  - **Retirado (Cierre):** El dinero real declarado físicamente en caja por la empleada al hacer el corte.
  - **Diferencia:** El desfase de dinero calculado automáticamente (`Efectivo Esperado - Efectivo Real`). Si falta dinero, el monto se tiñe de **rojo** (con signo negativo); si sobra, de **verde**; y si es exacto, se muestra neutral.
  - **Estado:** Indica si el turno está *"abierto"* (activo) o *"cerrado"*.

---

## 2.2 Estadísticas y Reportes (Indicadores Clave)
Esta pestaña te permite consultar y exportar una gran variedad de reportes analíticos agrupados de forma jerárquica.

### Selector de Indicadores:
Al hacer clic en el menú desplegable, puedes buscar o seleccionar indicadores categorizados en:
1. **Clientes:**
   - *1.1.1.- Nº Total de clientes nuevos:* Registros de clientes por primera vez en el sistema.
   - *1.1.2.- Nº Total de primeras sesiones:* Conteo de clientes que toman un servicio por primera vez.
   - *1.1.3.- Nº Total de primeras compras:* Registros y montos de las primeras transacciones de clientes nuevos.
   - *1.2.- Desglose de ¿cómo nos ha conocido?:* Estadísticas sobre la procedencia de los clientes (ej: Instagram, recomendación) para evaluar campañas publicitarias.
2. **Servicios:**
   - *2.3.1.- Nº Total de clientes por tratamiento:* Clientes atendidos por cada tipo de servicio.
   - *2.4.- Nº Medio de tratamientos por cliente:* Promedio de servicios realizados por cliente (ticket promedio de servicios).
   - *2.5.- Tiempo medio de duración de tratamientos:* Duración real de los tratamientos en minutos y cantidad de sesiones totales realizadas.
   - *2.6.- Desglose de sesiones asistidas por tratamiento.*
   - *2.7.- Sesiones asistidas por profesional y tratamiento.*
3. **Agenda:**
   - *3.1.- Porcentaje de citas no asistidas (No-Show):* Tasa de inasistencias en general o desglosada por profesional.
   - *3.5.- Desglose de citas no asistidas.*
   - *3.7.- Desglose de citas en agenda:* Cantidad y porcentaje de citas agrupadas por su estado (Confirmada, Pendiente, Cancelada).
4. **Facturación:**
   - *4.0.- Facturación Neta (Ingresos - Gastos):* Reporte consolidado de ingresos, egresos de caja y el resultado neto de rentabilidad de la sucursal.
   - *4.1.1.- Facturación total:* Facturación global expresada en pesos y porcentaje.
   - *4.1.2.- Ventas totales:* Ventas de productos o ítems no asociados a citas.
   - *4.4.1.- Desglose de facturación por tratamiento.*
   - *4.5.1.- Desglose de facturación por profesional (ventas por colaboradora).*
   - *4.6.1.- Desglose de facturación por familia de servicios.*
   - *4.8.1.- Desglose de facturación por vendedor.*
   - *4.9.1.- Desglose de facturación por producto.*
   - *4.10.- Facturación estimada según agenda:* Proyecciones financieras según las citas programadas a futuro.
   - *4.12.1.- Desglose de facturación por forma de pago (Efectivo vs. Tarjeta).*
   - *4.16.1.- Desglose de tratamientos por unidades realizadas.*
   - *4.17.1.- Desglose de facturación por hora:* Identifica las horas de mayor facturación del estudio.
   - *4.18.- Reporte de ingresos generados por servicios.*

### Filtros y Acciones:
- **Filtros de Desglose:** Puedes agrupar los resultados según te convenga: *Por sucursal*, *Por mes*, *Por día* o *Por profesional*.
- **Ordenar por:** Ordena la tabla alfabéticamente o por importes/cantidades de forma ascendente o descendente.
- **Acción "Calcular":** Procesa la consulta en la base de datos y muestra los resultados en pantalla con paginación interactiva.
- **Acción "Exportar a Excel":** Descarga un archivo CSV formateado adecuadamente para abrirse en Microsoft Excel de forma nativa.

---

<div class="page-break"></div>

## 2.3 Desempeño y Comisiones (Hoja de Comisiones)
Esta herramienta es indispensable para calcular la pre-nómina de comisiones de las profesionales de manera automática al cierre de cada mes.

### Lógica de Cálculo de Comisión:
1. **Suma de Ventas Brutas:** El sistema suma el total de servicios cobrados **(con IVA)** realizados por cada empleada en el mes seleccionado.
2. **Determinación del Tramo (Umbral):** Se localiza en la tabla de comisiones el tramo de ingresos brutos que la colaboradora alcanzó.
3. **Estatus de Evaluación ("Cumplió Hoja"):** El administrador evalúa en la sub-vista de *"Evaluación"* si la colaboradora cumplió con su hoja de metas del mes. Si cumplió (botón verde), se le asigna el porcentaje de la columna **Con Hoja**. Si no cumplió (botón gris), se le asigna el porcentaje de la columna **Sin Hoja**.
4. **Base Imponible Neta:** El porcentaje de comisión obtenido se aplica directamente sobre las ventas **netas (sin IVA)** de la empleada. La fórmula es: `Comisión = (Ventas Brutas ÷ 1.16) × Porcentaje de Comisión`.

### Sub-vistas Disponibles:
- **Pestaña Evaluación:** Muestra la lista de empleadas activas. Puedes hacer clic en el botón de estado para cambiarlo a **"Cumplió"** (verde) o **"Sin Hoja"** (gris) y agregar notas opcionales. Recuerda presionar el botón **Guardar** arriba a la derecha para aplicar los cambios.
- **Pestaña Comisiones:** Muestra el total a pagar del mes y una tabla analítica con el nombre de cada profesional, su estatus de hoja, sus ventas brutas totales, el porcentaje de comisión asignado y el pago final de comisión calculado.

### Tabla de Comisiones Oficial (Vigente en la Base de Datos)
Los umbrales de ventas y porcentajes cargados en el sistema son los siguientes:

| Umbral de Ventas Mensual (Con IVA) | % Comisión (Con Hoja) | % Comisión (Sin Hoja) |
|------------------------------------|-----------------------|-----------------------|
| Menos de $24,000                   | 0.0%                  | 0.0%                  |
| **$24,000** o más                  | 4.0%                  | 2.0%                  |
| **$30,000** o más                  | 4.5%                  | 2.5%                  |
| **$36,000** o más                  | 5.0%                  | 3.0%                  |
| **$42,000** o más                  | 5.5%                  | 3.5%                  |
| **$48,000** o más                  | 6.0%                  | 4.0%                  |
| **$54,000** o más                  | 6.5%                  | 4.5%                  |
| **$60,000** o más                  | 7.0%                  | 5.0%                  |
| **$66,000** o más                  | 7.5%                  | 5.5%                  |
| **$72,000** o más                  | 8.0%                  | 6.0%                  |
| **$78,000** o más                  | 8.5%                  | 6.5%                  |
| **$84,000** o más                  | 9.0%                  | 7.0%                  |

# 3. Panel de Administración (Configuración)

Desde el panel de **Administración** (ubicado en el menú de Configuración), puedes auditar la infraestructura de tus sedes, descargar documentos internos y actualizar tus claves. 

Este panel se compone de tres pestañas principales:

## 3.1 Sucursales y Staff
Muestra la lista de sucursales activas y el personal asignado a cada una de ellas.

![Gestión de Staff y Sucursales](img/administracion_staff.png)

### Edición de Sucursales (Configuración de Sedes):
Al hacer clic en el botón de configuración de una sucursal, podrás gestionar y modificar la información operativa de la misma:
- **Cabinas Disponibles:** Administra el número total de **cabinas libres/disponibles** de la sucursal (`num_cabinas`), lo cual controla el límite de citas simultáneas que requieren cabina.
- **Horarios Comerciales:** Configura de forma detallada la hora de apertura y cierre para cada día de la semana (Lunes a Domingo), definiendo horarios diferenciados para fines de semana o marcando días como cerrados.
- **Datos Fiscales e Información de Contacto:** Actualiza la dirección, el teléfono de la sede y el RFC de facturación.

---

## 3.2 Seguridad
Esta pestaña está destinada para la gestión del **Acceso Personal**.
- Permite actualizar de forma segura tu contraseña actual de acceso al sistema (mínimo 6 caracteres).

---

## 3.3 Documentos (Repositorio Digital)
Un archivero en la nube exclusivo para la administración del negocio.
- **Gestión de Archivos:** Permite subir (`Upload`) y eliminar (`Delete`) archivos en formato PDF, imágenes o documentos legales (como contratos de personal, licencias comerciales o manuales de procedimientos).
- **Acceso:** Cualquier administrador de cualquier sucursal puede descargar (`Download`) estos archivos de manera instantánea.

> [!IMPORTANT]
> **Políticas de Alta de Perfiles y Modificación de Comisiones:**
> Para garantizar la integridad de la base de datos y la seguridad financiera del negocio:
> 1. **Creación de Perfiles de Usuario:** Los accesos e inicios de sesión de nuevas colaboradoras no pueden crearse directamente desde la interfaz del sistema. Para dar de alta a una empleada en la base de datos, debes **contactar directamente al departamento de IT (David Rizo)**.
> 2. **Modificación de Comisiones:** Los umbrales de ventas y porcentajes de comisiones están protegidos en Supabase. Si necesitas cambiar algún valor de la tabla de comisiones, este ajuste debe ser realizado y aprobado por **IT (David Rizo)**.

---

# 4. Control de Agenda y Bloqueos Masivos

Para inhabilitar horarios del staff de forma masiva (por ejemplo, para capacitación grupal, juntas generales o cierres de sucursal por remodelación/días festivos):
1. Dirígete a la pestaña **Agenda**.
2. Haz clic en el botón de **Bloqueo Masivo** en la esquina superior derecha.
3. Define las fechas, el horario de inicio y fin, selecciona si aplica a todo el staff y escribe la razón del bloqueo.

![Bloqueo Masivo de Agenda](img/bloqueo_masivo.png)

---

# 5. Vacaciones y Ausencias (Operaciones)

El calendario de inasistencias **no se encuentra en Configuración**, sino en la pestaña de **Vacaciones** (bajo la categoría de *Operaciones* del menú lateral).

- **Gestión de Fechas Libres:** Registra de forma anticipada los días de vacaciones aprobados, ausencias justificadas o incapacidades médicas del personal.
- **Bloqueo Automático:** Al registrar una ausencia en esta sección, el sistema bloquea inmediatamente la agenda de esa colaboradora para las fechas seleccionadas, impidiendo que tanto clientes desde el portal de reservas como empleadas desde la recepción puedan agendar citas en sus días de descanso.

---

# 6. Inventario

Llevar el control de tus insumos y productos de venta directa.

![Control de Inventario](img/inventario.png)

- **Inventario Automatizado:** Al dar de alta un producto con su respectivo código, el sistema descontará automáticamente una unidad del stock de la sucursal seleccionada cada vez que una empleada agregue y cobre dicho producto durante el proceso de cobro en la agenda.
