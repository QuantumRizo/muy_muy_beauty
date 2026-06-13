import {
  q_clientes_nuevos, q_primeras_sesiones, q_primeras_compras, q_como_conocio,
  q_clientes_por_tratamiento, q_media_tratamientos, q_retention_rate
} from './queries/clientes'

import {
  q_duracion_media, q_sesiones_asistidas, q_sesiones_profesional_tratamiento,
  q_no_asistidas_pct, q_desglose_no_asistidas, q_citas_agenda, q_citas_tendencia,
  q_heatmap_afluencia
} from './queries/agenda'

import {
  q_facturacion_neta, q_facturacion, q_facturacion_tratamiento, q_facturacion_profesional,
  q_facturacion_familia, q_facturacion_vendedor, q_facturacion_producto, q_facturacion_estimada,
  q_por_forma_pago, q_tratamientos_unidades, q_facturacion_por_hora, q_ingresos_servicios,
  q_ticket_promedio, q_ingresos_sucursal_stacked, q_service_mix, q_top_empleados,
  q_servicios_familia_tendencia
} from './queries/facturacion'

import {
  q_inventory_metrics, q_salary_metrics, q_cash_metrics, q_stock_semaforo
} from './queries/inventario'

import type { ReportResult, ReportRow } from './queries/core'

export type { ReportResult, ReportRow }

export async function runQuery(
  id: string,
  desglose: string,
  sort: string,
  fechaInicio: string,
  fechaFin: string,
  sucursalId: string
): Promise<ReportResult> {
  switch (id) {
    case '1.1.1': return q_clientes_nuevos(desglose, sort, fechaInicio, fechaFin)
    case '1.1.2': return q_primeras_sesiones(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '1.1.3': return q_primeras_compras(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '1.2':   return q_como_conocio(sort, fechaInicio, fechaFin)
    case '2.3.1': return q_clientes_por_tratamiento(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.4':   return q_media_tratamientos(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.5':   return q_duracion_media(sort)
    case '2.6':   return q_sesiones_asistidas(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '2.7':   return q_sesiones_profesional_tratamiento(sort, fechaInicio, fechaFin, sucursalId)
    case '3.1':   return q_no_asistidas_pct(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '3.5':   return q_desglose_no_asistidas(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '3.7':   return q_citas_agenda(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.0':   return q_facturacion_neta(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.1.1': return q_facturacion(desglose, sort, fechaInicio, fechaFin, sucursalId, false)
    case '4.1.2': return q_facturacion(desglose, sort, fechaInicio, fechaFin, sucursalId, true)
    case '4.4.1': return q_facturacion_tratamiento(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.5.1': return q_facturacion_profesional(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.6.1': return q_facturacion_familia(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.8.1': return q_facturacion_vendedor(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.9.1': return q_facturacion_producto(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.10':  return q_facturacion_estimada(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.12.1':return q_por_forma_pago(sort, fechaInicio, fechaFin, sucursalId)
    case '4.16.1':return q_tratamientos_unidades(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '4.17.1':return q_facturacion_por_hora(sort, fechaInicio, fechaFin, sucursalId)
    case '4.18':  return q_ingresos_servicios(desglose, sort, fechaInicio, fechaFin, sucursalId)
    case '5.1':   return q_inventory_metrics(fechaInicio, fechaFin, sucursalId)
    case '5.2':   return q_salary_metrics()
    case '5.3':   return q_cash_metrics(fechaInicio, fechaFin, sucursalId)
    case 'A.1':   return q_ticket_promedio(fechaInicio, fechaFin, sucursalId)
    case 'A.2':   return q_retention_rate(fechaInicio, fechaFin)
    case 'A.3':   return q_ingresos_sucursal_stacked(fechaInicio, fechaFin)
    case 'A.4':   return q_service_mix(fechaInicio, fechaFin, sucursalId)
    case 'A.5':   return q_citas_tendencia(fechaInicio, fechaFin, sucursalId)
    case 'A.6':   return q_heatmap_afluencia(fechaInicio, fechaFin, sucursalId)
    case 'A.7':   return q_stock_semaforo()
    case 'A.8':   return q_top_empleados(fechaInicio, fechaFin, sucursalId)
    case 'A.9':   return q_servicios_familia_tendencia(fechaInicio, fechaFin, sucursalId)
    default: throw new Error(`Indicador ${id} no implementado`)
  }
}
