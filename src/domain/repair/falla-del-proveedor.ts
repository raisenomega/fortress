import type { Analysis } from './analysis'
import type { Candidate } from './select-target'

/**
 * La marca de «el proveedor fallo y no hubo analisis» (cuota, autenticacion,
 * sobrecarga). Hermana de NO_ARRANCO y distinta de ILEGIBLE: ILEGIBLE supone que
 * el analista contesto algo que no se dejo leer; aqui no contesto nadie — lo que
 * llego fue el aviso del proveedor (el 429 del 2026-10-05, la rafaga de 16).
 */
export const PROVEEDOR = 'el proveedor fallo: '

export function fallaDelProveedor(a: Analysis): boolean {
  return a.risk.startsWith(PROVEEDOR)
}

// prettier-ignore
export function sinRespuesta(target: Candidate, causa: string): Analysis {
  return {
    target, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '',
    doNotTouch: '', risk: `${PROVEEDOR}${causa}`, tokensUsed: 0
  }
}

/** El analista corrio, pero en un modelo que no es el suyo (Fable, o por debajo
 *  de opus): su dictamen no vale — ADR-078, enmienda del 2026-10-05. */
export const MODELO_FUERA = 'modelo no asignado: '

export function modeloFuera(a: Analysis): boolean {
  return a.risk.startsWith(MODELO_FUERA)
}

export const sinModeloAsignado = (target: Candidate, motivo: string): Analysis => ({ ...sinRespuesta(target, ''), risk: `${MODELO_FUERA}${motivo}` }) // prettier-ignore
