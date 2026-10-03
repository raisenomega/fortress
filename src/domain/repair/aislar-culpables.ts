export interface Aislamiento {
  /** El subconjunto minimo que sigue rompiendo. Un par, si el choque es a dos. */
  readonly culpables: readonly string[]
  /** Cuantas veces hubo que medir: el coste real de la autopsia. */
  readonly medidas: number
}

/**
 * Aisla el subconjunto minimo de una tanda ROJA que sigue rompiendo (deuda #2,
 * pieza 2). Quien llama ya midio el conjunto entero y salio rojo; `verde`
 * responde si un subconjunto pasa el gate — cada llamada cuesta una sonda
 * (~5 min), por eso se cuenta y por eso se bisecta en vez de medir pares:
 * 36 propuestas son 630 pares, y la biseccion lo deja en el orden de 2·log N.
 *
 * La forma es la del caso real (2-oct): dos fixes verdes por separado y rojos
 * juntos. Cuando las dos mitades salen verdes, el choque CRUZA la particion:
 * se minimiza un lado con el otro de contexto, y luego el otro contra lo ya
 * aislado. El invariante de cada paso es que contexto+candidatos es rojo.
 */
export async function aislarCulpables(
  tanda: readonly string[],
  verde: (subconjunto: readonly string[]) => Promise<boolean>
): Promise<Aislamiento> {
  let medidas = 0
  const mide = async (s: readonly string[]): Promise<boolean> => ((medidas += 1), verde(s))

  async function minimo(
    ctx: readonly string[],
    candidatos: readonly string[]
  ): Promise<readonly string[]> {
    // prettier-ignore
    if (candidatos.length <= 1) return candidatos
    const mitad = Math.ceil(candidatos.length / 2)
    const a = candidatos.slice(0, mitad)
    const b = candidatos.slice(mitad)
    if (!(await mide([...ctx, ...a]))) return minimo(ctx, a)
    if (!(await mide([...ctx, ...b]))) return minimo(ctx, b)
    const izquierda = await minimo([...ctx, ...b], a)
    const derecha = await minimo([...ctx, ...izquierda], b)
    return [...izquierda, ...derecha]
  }

  return { culpables: await minimo([], tanda), medidas }
}
