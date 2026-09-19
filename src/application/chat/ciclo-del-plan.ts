import { createHash } from 'node:crypto'
import { puedeSeguir, type JuicioDelPlan } from '@domain/chat/juicio-del-plan'
import { replanteoComoPedido } from '@domain/chat/replanteo-como-pedido'

export interface CicloDelPlanDeps {
  /** Propone un plan; con `replanteo`, atendiendo la objecion de OMEGA. */
  readonly proponer: (replanteo: string | null) => Promise<string>
  /** Juzga la DIRECCION. `null` = no se pudo juzgar: decide quien llama. */
  readonly juzgar: (propuesta: string) => Promise<JuicioDelPlan | null>
}

export interface PlanAprobado {
  readonly propuesta: string
  readonly aprobado: boolean
  /** La ultima objecion, cuando no se aprobo. */
  readonly razon: string | null
  readonly intentos: number
}

/**
 * Propone, deja que OMEGA mire la direccion, y si pide replantear REPROPONE —
 * hasta que apruebe o deje de avanzar (ADR-097 §5).
 *
 * HERMANO de `hastaConverger`, y las diferencias son las dos que lo justifican:
 *
 * SIN RED. `hastaConverger` corre dentro de `conRedDeReversion`, que abre un
 * checkpoint y decide conservar o revertir. Un plan NO edita: meterlo por ahi
 * abriria un checkpoint vacio por vuelta sobre un arbol que nadie toco. No hay
 * nada que proteger porque no hay nada escrito.
 *
 * MISMA HUELLA. Converger sigue sin ser un contador: si el segundo plan es el
 * mismo texto que uno ya rechazado, el productor da vueltas y otra vuelta dara
 * lo mismo. Aqui la huella es del TEXTO porque el texto ES la propuesta — al
 * contrario que en el fix, donde la prosa no entra en la huella porque lo que
 * se juzga es el diff (ADR-096 §4.3).
 *
 * Si OMEGA no llega a juzgar, NO se inventa una aprobacion: sale sin aprobar y
 * decide quien llama, igual que el gate decide cuando el juez del fix no
 * arranca.
 *
 * DOS OPORTUNIDADES, MEDIDAS POR PROGRESO Y NO POR CUPO. A la primera huella
 * repetida no se corta: se le deja UNA vuelta mas. No es un cupo disfrazado de
 * dos — es la doctrina que `retry-eligibility` ya escribio para el analisis
 * ilegible: *«la respuesta de un modelo no es la misma dos veces, asi que
 * repetir SI puede dar otra cosa»*. A la SEGUNDA repetida ya no es mala suerte:
 * es que el productor no tiene otra direccion que ofrecer, y ahi para.
 *
 * NO hay «sesion fresca» que pedir, y no es un olvido: el turno de plan no lleva
 * foco, y `produce-reply` solo reanuda sesion cuando lo hay. Cada replanteo YA
 * nace sin `--resume`, sin memoria del texto anterior — que es justo lo que se
 * queria de una sesion fresca. Por eso la objecion viaja entera en el prompt
 * (`replanteoComoPedido`) y no apoyada en un hilo que no existe.
 */
export async function hastaAprobarElPlan(deps: CicloDelPlanDeps): Promise<PlanAprobado> {
  const vistos = new Set<string>()
  let replanteo: string | null = null
  let yaRepitio = false

  for (let intentos = 1; ; intentos += 1) {
    const propuesta = await deps.proponer(replanteo)
    const juicio = await deps.juzgar(propuesta)
    if (juicio === null) return { propuesta, aprobado: false, razon: null, intentos }
    if (puedeSeguir(juicio.veredicto)) {
      return { propuesta, aprobado: true, razon: null, intentos }
    }

    const huella = createHash('sha1').update(propuesta).digest('hex')
    if (vistos.has(huella)) {
      if (yaRepitio) return { propuesta, aprobado: false, razon: juicio.razon, intentos }
      yaRepitio = true
    }
    vistos.add(huella)
    replanteo = replanteoComoPedido(juicio.razon)
  }
}
