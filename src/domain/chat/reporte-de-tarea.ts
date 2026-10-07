import type { TokenUsage } from '../telemetry/token-usage'
import type { SinCierre } from './motivo-sin-cierre'

/**
 * Lo que el constructor LEE del turno terminado (PASO 87). Es ESTRUCTURAL a
 * proposito: `SendMessageOutput` (application) lo satisface sin que el dominio
 * lo importe — dependencias hacia adentro. El `assistant.content` es el texto
 * PERSISTIDO: ya tachado y con las NOTAS cortadas (PASO 80). El reporte hereda
 * esa redaccion leyendo SOLO este campo; aqui no entra ningun crudo.
 */
export interface ResultadoDelTurno {
  readonly assistant: { readonly content: string }
  readonly failed: boolean
  readonly edits: readonly string[]
  readonly sinCierre: SinCierre | null
  readonly sinVerificar: boolean
  readonly usage: TokenUsage
  readonly modelo?: string
  readonly hallazgos: number
}

/**
 * El resultado de la tarea asignada, como lo consume la vista del CTO: el cable
 * de dato del lazo. EMPAQUETA lo que el turno ya produjo — no inventa nada, y
 * un campo que el turno no dijo queda null, nunca supuesto (ADR-078).
 */
export interface ReporteDeTarea {
  readonly estado: 'hecho' | 'fallido'
  /** El texto del asistente tal cual se persistio: tachado y sin NOTAS. */
  readonly resumen: string
  readonly edits: readonly string[]
  readonly verificacion: 'verificado' | 'sin_verificar'
  readonly cierre: SinCierre | null
  readonly usage: TokenUsage
  readonly modelo: string | null
  readonly hallazgos: number
}

/** El reporte COMO MENSAJE (PASO 89): cabecera de una linea y debajo el
 *  resumen ENTERO — lo que la vuelta precarga en el input del CTO, gemelo
 *  exacto del Transferir. El resumen ya viene tachado y sin NOTAS. */
export function textoDelReporte(reporte: ReporteDeTarea): string {
  const cabecera = `[Terminal] ${reporte.estado} · ${reporte.verificacion} · ${reporte.modelo ?? 'modelo no consta'} · $${reporte.usage.costUsd.toFixed(2)} · hallazgos: ${reporte.hallazgos}` // prettier-ignore
  return `${cabecera}\n\n${reporte.resumen}`
}

export function reporteDeTarea(r: ResultadoDelTurno): ReporteDeTarea {
  return {
    estado: r.failed ? 'fallido' : 'hecho',
    resumen: r.assistant.content,
    edits: r.edits,
    verificacion: r.sinVerificar ? 'sin_verificar' : 'verificado',
    cierre: r.sinCierre,
    usage: r.usage,
    modelo: r.modelo ?? null,
    hallazgos: r.hallazgos
  }
}
