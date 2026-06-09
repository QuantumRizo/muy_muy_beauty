import sys
import re

path = '/Users/david/Projects/muy_muy_beauty/docs/manual_administradores.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace numbers backwards to avoid overlapping replacements
content = content.replace("# 6. Inventario", "# 7. Inventario")
content = content.replace("# 5. Vacaciones y Ausencias", "# 6. Vacaciones y Ausencias")
content = content.replace("# 4. Control de Agenda", "# 5. Control de Agenda")

content = content.replace("## 3.3", "## 4.3")
content = content.replace("## 3.2", "## 4.2")
content = content.replace("## 3.1", "## 4.1")
content = content.replace("# 3. Panel de Administración", "# 4. Panel de Administración")

content = content.replace("## 2.3", "## 3.3")
content = content.replace("## 2.2", "## 3.2")
content = content.replace("## 2.1", "## 3.1")

new_section = """# 2. Dashboard Principal (Inicio)

El **Dashboard Principal** te permite monitorear el rendimiento general del negocio al instante. Al entrar al sistema o hacer clic en "Inicio", verás métricas clave que resumen la salud financiera y operativa de las sucursales.

![Dashboard de Métricas](img/dashboard_metricas.png)

Desde esta pantalla puedes:
- **Filtrar por Sucursal y Fecha:** Cambiar entre vistas de "Hoy", "Semana" o "Mes" para todas las sucursales combinadas o una en específico.
- **Visualizar Ingresos y KPI:** Monitorear ingresos totales, ticket promedio, tasa de retención de clientes y diferencias de caja.
- **Gráficos de Tendencias:** Observar cómo se comportan los ingresos (comisiones vs sueldos vs utilidad) y qué servicios son los más solicitados por tus clientes a lo largo del periodo.
- **Rendimiento de Staff:** Ver rápidamente el Top 10 de profesionales con mayores ventas, y el método de pago preferido de los clientes.

---

"""

content = content.replace("# 2. Centro de Análisis", new_section + "# 3. Centro de Análisis")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Manual actualizado exitosamente.")
