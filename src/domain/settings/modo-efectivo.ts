import { ejecutaConConfianza } from '../repair/confianza'
import type { Project } from '../project/project'
import type { OperationMode } from './operation-mode'
import { isProtectedArea } from './protected-areas'

/** Lo que decide el modo efectivo. Objeto y no cuatro posicionales: dos banderas
 *  seguidas se intercambian sin que el compilador se entere. */
export interface ModoPedido {
  readonly mode: OperationMode
  readonly request: string
  /** El objetivo es el propio repo de FORTRESS. */
  readonly selfRepo: boolean
  /** El proyecto sobre el que se va a trabajar. Ausente degrada: sin proyecto no
   *  hay confianza que consultar. */
  readonly project: Project | null
}

/**
 * El modo efectivo degrada a supervisado si la peticion toca un area protegida,
 * si el objetivo es el propio repo de FORTRESS, o si el proyecto no es de
 * confianza.
 *
 * El repo propio degrada por la misma razon que existe el motor disciplinado:
 * los guards del sistema (este archivo, el gate del loop, el allowlist de
 * comandos) son archivos como cualquier otro. Un agente autonomo que "limpia
 * codigo muerto" o "simplifica esta funcion" sobre ellos puede desmontar su
 * propia jaula sin ninguna mala intencion y sin revisor que lo vea. Escribir
 * sobre el codigo propio exige revision externa, y esa vive en el motor.
 *
 * La confianza degrada por el mismo principio que ya aplica el gate: actuar
 * sobre un repo ajeno la exige. Alli lo que se ejecutaba era su codigo; aqui lo
 * que se hace es escribir en el, que es la otra mitad de actuar. Degradar y no
 * bloquear es lo proporcionado: el operador sigue trabajando el proyecto, pero
 * viendo cada edicion en vez de concederlas por adelantado.
 */
export function effectiveMode(pedido: ModoPedido): OperationMode {
  if (pedido.mode !== 'autonomo') return pedido.mode
  const degrada =
    pedido.selfRepo || isProtectedArea(pedido.request) || !ejecutaConConfianza(pedido.project)
  return degrada ? 'supervisado' : pedido.mode
}
