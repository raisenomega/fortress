import { ejecutaConConfianza } from '../repair/confianza'
import type { Project } from '../project/project'
import type { OperationMode } from './operation-mode'

/** Lo que decide el modo efectivo. Objeto y no cinco posicionales: dos banderas
 *  seguidas se intercambian sin que el compilador se entere. */
export interface ModoPedido {
  readonly mode: OperationMode
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
 * El modo efectivo degrada a supervisado por TRES razones, y las tres son
 * ESTRUCTURALES: el objetivo es el propio repo de FORTRESS, el proyecto no es de
 * confianza, o no hay red de reversion.
 *
 * Habia una cuarta —que el TEXTO de la peticion mencionara un area protegida— y
 * se retiro (ADR-089). Miraba palabras: «security», «token», «auth». En una
 * herramienta cuyos hallazgos son de seguridad por definicion, degradaba la
 * mayoria de lo que encuentra: un hallazgo llamado «falta Content-Security-
 * Policy» no se podia resolver porque contenia «security». El freno impedia al
 * producto hacer aquello para lo que existe.
 *
 * Lo que lo sustituye no es nada: es lo que ya habia debajo. La firma humana
 * —el operador eligio autonomo y marco el proyecto de confianza—, el criterio
 * del propio modelo, el gate, y git, que revierte. El Motor, que trabaja SIN
 * humano delante, nunca tuvo freno de palabras y se defiende asi desde siempre.
 *
 * Las tres que quedan no son listas: son hechos del terreno.
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
    pedido.selfRepo || !ejecutaConConfianza(pedido.project) || !pedido.redGit
  return degrada ? 'supervisado' : pedido.mode
}
