import { esModuloAuditoria, type ModuloAuditoria } from './modulo-auditoria'
import type { ModuloConRazon } from './modulos-aplicables'

/**
 * La campana de este escaneo, tal y como quedo al cerrarlo (ADR-083, Fase 5).
 *
 * Se PERSISTE porque el informe transcribe lo que se decidio ENTONCES. Volver a
 * medir al componer daria lo que aplica hoy: el arbol pudo cambiar, el operador
 * pudo sembrar la plantilla que faltaba, y el informe afirmaria de un escaneo
 * de ayer cosas que solo son ciertas ahora. Un informe que se recalcula no es
 * un informe, es una foto de otro dia con la fecha de esta.
 */
export interface ModulosDelCierre {
  readonly aplicables: readonly ModuloAuditoria[]
  readonly descartados: readonly ModuloConRazon[]
  readonly sinConstancia: readonly ModuloConRazon[]
  /** Los modulos de TEMA que de verdad corrieron su parada, no los que aplicaban. */
  readonly temasCorridos: readonly ModuloAuditoria[]
  /** Aplicaban y su plantilla no estaba sembrada: se auditaron con la checklist. */
  readonly plantillasAusentes: readonly ModuloAuditoria[]
}

export const SIN_CAMPANA: ModulosDelCierre = {
  aplicables: [],
  descartados: [],
  sinConstancia: [],
  temasCorridos: [],
  plantillasAusentes: []
}

const modulos = (valor: unknown): readonly ModuloAuditoria[] =>
  Array.isArray(valor) ? valor.filter(esModuloAuditoria) : []

const conRazon = (valor: unknown): readonly ModuloConRazon[] =>
  Array.isArray(valor)
    ? valor
        .map((x) => x as Record<string, unknown>)
        .filter((x) => esModuloAuditoria(x.modulo) && typeof x.razon === 'string')
        .map((x) => ({ modulo: x.modulo as ModuloAuditoria, razon: x.razon as string }))
    : []

/**
 * Del TEXT de la columna al vocabulario. Molde `aDeclaracion`: lo que no se
 * reconoce no se adivina. Null es «no consta» —los escaneos anteriores a la
 * campana no la tuvieron— y cae a la campana vacia, que el informe sabe leer.
 */
export function aModulosDelCierre(raw: string | null): ModulosDelCierre {
  if (raw === null || raw === '') return SIN_CAMPANA
  try {
    const c = JSON.parse(raw) as Record<string, unknown>
    return {
      aplicables: modulos(c.aplicables),
      descartados: conRazon(c.descartados),
      sinConstancia: conRazon(c.sinConstancia),
      temasCorridos: modulos(c.temasCorridos),
      plantillasAusentes: modulos(c.plantillasAusentes)
    }
  } catch {
    return SIN_CAMPANA
  }
}
