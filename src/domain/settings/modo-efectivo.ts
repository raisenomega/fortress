import { ejecutaConConfianza } from '../repair/confianza'
import type { Project } from '../project/project'
import type { OperationMode } from './operation-mode'
import { isProtectedArea } from './protected-areas'

/** Lo que decide el modo efectivo. Objeto y no cinco posicionales: dos banderas
 *  seguidas se intercambian sin que el compilador se entere. */
export interface ModoPedido {
  readonly mode: OperationMode
  readonly request: string
  /** El objetivo es el propio repo de FORTRESS. */
  readonly selfRepo: boolean
  /** El proyecto sobre el que se va a trabajar. Ausente degrada: sin proyecto no
   *  hay confianza que consultar. */
  readonly project: Project | null
  /** Hay red de reversion posible: la carpeta es la raiz de su propio repo git
   *  y tiene historia (ADR-079). Lo calcula la infraestructura —es git— y entra
   *  aqui ya decidido: el dominio no lanza procesos. */
  readonly redGit: boolean
}

/**
 * El modo efectivo degrada a supervisado si la peticion toca un area protegida,
 * si el objetivo es el propio repo de FORTRESS, si el proyecto no es de
 * confianza, o si no hay red de reversion.
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
 *
 * La red de reversion degrada porque editar el arbol vivo sin poder deshacerlo
 * es justo lo que ADR-079 prohibe: sin raiz de repo git no hay checkpoint, y
 * sin checkpoint el autonomo escribiria sin vuelta. Se degrada y no se rechaza
 * por lo mismo que la confianza: se sigue preguntando y analizando.
 */
export function effectiveMode(pedido: ModoPedido): OperationMode {
  if (pedido.mode !== 'autonomo') return pedido.mode
  const degrada =
    pedido.selfRepo ||
    isProtectedArea(pedido.request) ||
    !ejecutaConConfianza(pedido.project) ||
    !pedido.redGit
  return degrada ? 'supervisado' : pedido.mode
}
