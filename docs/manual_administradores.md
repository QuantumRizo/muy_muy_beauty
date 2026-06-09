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

El **Centro de Análisis** es tu panel financiero y de control. Aquí se consolida toda la información comercial de las sucursales del estudio.

![Centro de Análisis](img/dashboard_metricas.png)

Este centro se divide en tres pestañas principales:

## 2.1 Ventas y Cajas
Es la pestaña operativa para auditoría de dinero e historial de transacciones. Contiene tres sub-pestañas:
- **Listado de ventas:** Muestra todas las ventas realizadas en un rango de fechas específico. Puedes filtrar por una sucursal en particular o ver "Todas las sucursales" en conjunto. Muestra el número de ticket, fecha, cliente, importe total y estado del pago (Pagado/Pendiente).
- **Pagos aplazados:** Permite monitorear las cuentas pendientes de clientes a quienes se les fió o dejaron saldos pendientes, con la posibilidad de registrar los abonos.
- **Buscador de cajas:** Permite auditar y consultar las aperturas y cierres de caja de días anteriores (quién abrió, monto inicial, ventas registradas, efectivo real declarado y diferencias).

## 2.2 Estadísticas y Reportes
Ofrece gráficas y resúmenes de rendimiento:
- **Ingresos por Sucursal / Globales:** Reportes diarios y mensuales de facturación.
- **Ventas por Categoría:** Desglose del porcentaje de ingresos proveniente de servicios vs. venta de productos.
- **Servicios Más Solicitados:** Identificación de los tratamientos estrella del salón.

<div class="page-break"></div>

## 2.3 Desempeño y Comisiones (Hoja de Comisiones)
Esta pantalla es crucial para el cierre de mes, ya que calcula de manera exacta los honorarios del staff basándose en las ventas cobradas.

### Lógica de Cálculo de Comisión:
1. **Ventas Brutas:** El sistema suma el total de servicios cobrados (con IVA) por cada empleada durante el mes.
2. **Identificación del Tramo (Umbral):** Se compara la venta bruta acumulada de la empleada con la tabla de comisiones vigente para encontrar el nivel de porcentaje correspondiente.
3. **Aplicación de la Evaluación ("Cumplió Hoja"):** El administrador evalúa mensualmente si la colaboradora cumplió con su hoja de desempeño. Si cumplió, recibe el porcentaje preferencial (*Con Hoja*). Si no, recibe el porcentaje estándar (*Sin Hoja*).
4. **Base Imponible:** La comisión final se calcula multiplicando el porcentaje correspondiente por la venta **neta (sin IVA)** de la empleada (Venta Bruta ÷ 1.16).

---

### Tabla de Comisiones Vigente
A continuación se detallan los umbrales y porcentajes cargados en la base de datos para el cálculo de comisiones:

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

---

<div class="page-break"></div>

# 3. Administración y Personal

En la sección de **Administración**, puedes monitorear y gestionar los perfiles de tu staff y su calendario de inasistencias.

![Gestión de Staff](img/administracion_staff.png)

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

# 5. Inventario

Llevar el control de tus insumos y productos de venta directa.

![Control de Inventario](img/inventario.png)

- **Inventario Automatizado:** Al dar de alta un producto con su respectivo código, el sistema descontará automáticamente una unidad del stock de la sucursal seleccionada cada vez que una empleada agregue y cobre dicho producto durante el proceso de cobro en la agenda.
