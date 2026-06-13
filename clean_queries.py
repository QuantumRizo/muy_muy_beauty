import re

with open('apps/web/src/lib/reportQueries.ts', 'r') as f:
    content = f.read()

def extract_funcs(prefixes):
    funcs = []
    # match async function name(...) { ... }
    for match in re.finditer(r'async function (q_[a-zA-Z0-9_]+)\(', content):
        name = match.group(1)
        if any(name.startswith(p) for p in prefixes) or name in prefixes:
            start_idx = match.start()
            # find the next async function or EOF
            next_match = re.search(r'\nasync function q_', content[start_idx+1:])
            end_idx = start_idx + 1 + next_match.start() if next_match else len(content)
            funcs.append(content[start_idx:end_idx].strip())
    return '\n\n'.join(funcs)

# Facturacion
fact_funcs = extract_funcs(['q_facturacion', 'q_por_forma_pago', 'q_tratamientos_unidades', 'q_ingresos_servicios', 'q_ticket_promedio', 'q_ingresos_sucursal_stacked', 'q_service_mix', 'q_top_empleados', 'q_servicios_familia_tendencia'])
with open('apps/web/src/lib/queries/facturacion.ts', 'w') as f:
    f.write("import { supabase } from '../supabase'\nimport { applySort } from '../reportConfig'\nimport { calcularPorcentaje, type CommissionThreshold } from '../commissions'\nimport { ReportResult, ReportRow, groupAndPct, pct, buildTotals } from './core'\n\n" + fact_funcs.replace('async function', 'export async function') + "\n")

# Inventario / Caja
inv_funcs = extract_funcs(['q_inventory_metrics', 'q_salary_metrics', 'q_cash_metrics', 'q_stock_semaforo'])
with open('apps/web/src/lib/queries/inventario.ts', 'w') as f:
    f.write("import { supabase } from '../supabase'\nimport { applySort } from '../reportConfig'\nimport { ReportResult, ReportRow, groupAndPct, pct, buildTotals } from './core'\nimport { endOfDayMXIso } from '../dateUtils'\n\n" + inv_funcs.replace('async function', 'export async function') + "\n")

