import { esEntorno } from '@domain/repair/averia'
import { casillaDeBaja } from '@domain/repair/clasificacion-de-baja'
import type { AppContext } from '../context'
import { runMotorChain } from './run-motor-chain'
import { registroDeColisiones } from './colisiones-de-la-corrida'
import type { DrenajeDeps, DrenajeResultado, FinDelDrenaje } from './drenaje-types'

export type { DrenajeDeps, DrenajeResultado, FinDelDrenaje } from './drenaje-types'

/**
 * Recorre los hallazgos elegibles de un proyecto dejando cada fix juzgado y
 * esperando firma. No escanea, no espera entre vueltas y no escribe al chat:
 * no es el loop, y reusarlo habria arrastrado las tres cosas.
 *
 * No lleva cuenta de a quien ha atendido. Una propuesta viva excluye a su
 * hallazgo de la seleccion, asi que la vuelta siguiente elige otro sola y el
 * pozo se vacia sin que nadie lo administre. Cuando no queda nadie, `planRepair`
 * devuelve sin-candidato y eso es el final normal: agotar los elegibles, no
 * chocar con un tope.
 */
export async function drenarHastaOmega(
  ctx: AppContext,
  projectId: string,
  deps: DrenajeDeps
): Promise<DrenajeResultado> {
  const cuenta = { trabajadas: 0, acumuladas: 0, vetadas: 0, porPresupuesto: 0, porTimeout: 0, porCorrea: 0, porLimitePropio: 0, porEntornoDelProyecto: 0, porDefectoInterno: 0, superadas: 0, sinClasificar: 0 } // prettier-ignore
  // Senal pura: `colisiones` se puebla sola al anotar y NO altera `cuenta` ni el
  // destino de nadie. El drenaje deja de ser mudo; la adjudicacion sigue fuera.
  const { colisiones, anotar } = registroDeColisiones(ctx)
  const fin = (f: FinDelDrenaje, detalle?: string): DrenajeResultado =>
    detalle === undefined ? { fin: f, ...cuenta, colisiones } : { fin: f, ...cuenta, colisiones, detalle } // prettier-ignore

  /**
   * Una baja, en la casilla que su motivo manda. El reparto vive en el dominio
   * y es una TABLA exhaustiva, no una cadena de `if` con un `else` al final:
   * aquel cajon anunciaba quince motivos como "gate o correa" —cierto en tres—
   * y mandaba a leer un diff que en varios de ellos nunca existio.
   */
  const anotarBaja = (motivo: string): void => {
    cuenta[casillaDeBaja(motivo)] += 1
  }

  for (let vuelta = 0; vuelta < deps.maxVueltas; vuelta += 1) {
    if (deps.cancelado()) return fin('detenido')
    if (deps.gastado() >= deps.costCapUsd) return fin('tope-gasto')
    // Y el del DIA, que es otro y manda mas: aquel acota esta sesion, este el
    // dinero real. Sale como `ocupado` —un freno del sistema haciendo su
    // trabajo, no una averia— con el texto que el operador tiene que leer.
    const tope = deps.topeDiario()
    if (tope !== null) return fin('ocupado', tope)

    const salida = await runMotorChain(ctx, projectId, deps.motor, 'hasta-omega')
    // Antes de leer el resultado: parar mata al hijo, y el hijo muriendo se
    // parece a una averia. Una parada humana es una parada, no un fallo.
    if (deps.cancelado()) return fin('detenido')
    // Las dos cortan, pero no son lo mismo y el parte no puede decir lo mismo:
    // una se arregla esperando y la otra mirando la maquina.
    if (!salida.ok) return fin(esEntorno(salida.error) ? 'entorno' : 'averia', salida.error)
    if (salida.value.kind === 'sin-candidato') return fin('sin-candidato')
    // El perimetro lo nego: no es que se agotara el pozo, es que no era suyo.
    if (salida.value.kind === 'negado') return fin('negado')

    cuenta.trabajadas += 1
    // Solo las que aterrizan espera-firma dejan huella: las bajas no tocan el arbol.
    if (salida.value.kind === 'espera-firma') { cuenta.acumuladas += 1; await anotar(salida.value.proposalId) } // prettier-ignore
    else if (salida.value.kind === 'descartada') anotarBaja(salida.value.motivo)
  }
  return fin('tope-vueltas')
}
