import { MOTIVOS_DE_RECHAZO, type EntradaAtendida, type Rechazada } from '@domain/system/atendidos-contrato' // prettier-ignore
import { parsearRegistro } from '@domain/system/atendidos-parse'
import type { AppContext } from '../context'

export interface ResumenImport {
  readonly atendidas: number
  readonly descartadas: number
  /** Cerraban algo YA cerrado. Se aplican, pero se cuentan aparte: pisar un
   *  cierre anterior es una decision del operador, no un detalle. */
  readonly sobrescritas: number
  /** Cada una con su porque. Un recuento mudo de rechazos no ensena nada. */
  readonly rechazadas: readonly Rechazada[]
}

const VACIO = { atendidas: 0, descartadas: 0, sobrescritas: 0 }

/**
 * Aplica el registro que alguien dejo fuera de la app: quien trabajo el backlog
 * dice en que quedo cada observacion, y aqui se asienta.
 *
 * Todo el lote va en UNA transaccion. Las entradas son independientes, pero una
 * caida a mitad dejaria el fichero aplicado a medias y nadie sabria por donde
 * iba; asi, o entra el lote o no entra ninguno, y reimportar es seguro.
 *
 * Es IDEMPOTENTE: reaplicar una entrada ya aplicada escribe lo mismo. Por eso
 * reimportar el fichero corregido no exige limpiar nada primero.
 */
export function importarAtendidos(ctx: AppContext, contenido: string): ResumenImport {
  const { validas, rechazadas } = parsearRegistro(contenido)
  const noEncontradas: Rechazada[] = []

  const cuenta = ctx.transaction(() => {
    const c = { ...VACIO }
    for (const e of validas) {
      const antes = ctx.selfObservations.findById(e.id)
      if (antes === null) {
        noEncontradas.push({ id: e.id, motivo: MOTIVOS_DE_RECHAZO.NO_ENCONTRADA })
        continue
      }
      aplicar(ctx, e)
      if (antes.status !== 'pendiente') c.sobrescritas += 1
      if (e.status === 'atendido') c.atendidas += 1
      else c.descartadas += 1
    }
    return c
  })

  return { ...cuenta, rechazadas: [...rechazadas, ...noEncontradas] }
}

function aplicar(ctx: AppContext, e: EntradaAtendida): void {
  ctx.selfObservations.setStatus({
    id: e.id,
    status: e.status,
    // El commit viaja pegado al motivo: la columna que lo guardaria sola no
    // existe, y anadirla para un dato opcional seria caro por poco.
    reason: e.fixSha === null ? e.reason : `${e.reason ?? ''} [fix: ${e.fixSha}]`.trim(),
    attendedBy: e.attendedBy,
    attendedAt: e.attendedAt
  })
}
