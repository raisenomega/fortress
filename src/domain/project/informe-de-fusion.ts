import type { Severity } from '../shared/severity'
import type { FilaAFusionar, Fusion } from './fusion-de-duplicados'

/** Una fila con lo que hace falta MOSTRAR, ademas de lo que hace falta DECIDIR. */
export interface FilaDelInforme extends FilaAFusionar {
  readonly severity: Severity
  readonly title: string
}

export interface GrupoDelInforme {
  readonly identidad: string
  readonly superviviente: FilaDelInforme
  readonly absorbidas: readonly FilaDelInforme[]
  /** La que quedaria en el tablero: hoy gana la fila mas antigua, con la suya. */
  readonly severidadSuperviviente: Severity
  /** La mas alta del grupo. Si no es la de la superviviente, fusionar BAJA la
   *  gravedad de ese defecto en el tablero y nadie se entera. */
  readonly severidadMaxima: Severity
  readonly discrepa: boolean
}

const esFila = (f: FilaDelInforme | undefined): f is FilaDelInforme => f !== undefined

/**
 * Lo que la fusion HARIA, sin hacerlo: el plan de `planDeFusion` con las caras
 * que hacen falta para APROBARLO —el titulo de cada fila y las dos severidades.
 *
 * La segunda severidad existe porque no entra ni en la identidad ni en el
 * desempate: un grupo con severidades mixtas pierde la mas alta al fundirse
 * —`send-preorder:364` tiene dos HIGH que se absorberian en una MEDIUM—. Este
 * informe no lo arregla: lo hace visible antes de que ocurra.
 *
 * NO importa nada en tiempo de ejecucion, y por eso recibe el plan y el
 * comparador en vez de llamarlos: un script suelto no puede resolver los
 * imports sin extension del dominio (deuda `contrato-scan-no-importable-desde-
 * script`), y el modo plan tiene que consumir ESTA funcion y no una copia suya.
 */
export function informeDeFusion(
  filas: readonly FilaDelInforme[],
  plan: readonly Fusion[],
  masUrgente: (severities: readonly Severity[]) => Severity
): readonly GrupoDelInforme[] {
  const porId = new Map(filas.map((f) => [f.id, f]))
  const grupos: GrupoDelInforme[] = []
  for (const fusion of plan) {
    const superviviente = porId.get(fusion.ganadora)
    if (superviviente === undefined) continue
    const absorbidas = fusion.absorbidas.map((id) => porId.get(id)).filter(esFila)
    const severidadMaxima = masUrgente([superviviente, ...absorbidas].map((f) => f.severity))
    grupos.push({
      identidad: fusion.identidad,
      superviviente,
      absorbidas,
      severidadSuperviviente: superviviente.severity,
      severidadMaxima,
      discrepa: severidadMaxima !== superviviente.severity
    })
  }
  return grupos
}
