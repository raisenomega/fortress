import { ficherosEnComun, tocaDependencias } from './arbol-que-se-movio'

export interface PropuestaDeTanda {
  readonly id: string
  readonly files: readonly string[]
}

export interface GuiaDeOrden {
  /** La sugerencia entera: grupos juntos, dependencias al final. */
  readonly orden: readonly string[]
  /** Los grupos de dos o mas que comparten fichero: pueden chocar en git. */
  readonly grupos: readonly (readonly string[])[]
  /** Las que tocan package.json o el lock: en cuanto una entra, las cruzadas
   *  caducan sin medir (`tocaDependencias` en la firma). Por eso, al final. */
  readonly dependencias: readonly string[]
}

/** Componentes conexas por «comparte fichero», transitivo y en orden de
 *  entrada: a-b y b-c son UN grupo aunque a y c no se toquen. */
function componentes(tanda: readonly PropuestaDeTanda[]): string[][] {
  const grupos: PropuestaDeTanda[][] = []
  for (const propuesta of tanda) {
    const tocados = grupos.filter((g) => g.some((m) => ficherosEnComun(m.files, propuesta.files).length > 0)) // prettier-ignore
    const fusionado = [...tocados.flat(), propuesta]
    for (const t of tocados) grupos.splice(grupos.indexOf(t), 1)
    grupos.push(fusionado)
  }
  // El orden de los grupos es el de ENTRADA de su primer miembro: la fusion
  // los empuja al final y sin esto la guia barajaria la cola sin motivo.
  const pos = new Map(tanda.map((p, i) => [p.id, i]))
  const primero = (g: PropuestaDeTanda[]): number => Math.min(...g.map((m) => pos.get(m.id) ?? 0))
  return grupos.sort((g1, g2) => primero(g1) - primero(g2)).map((g) => g.map((m) => m.id))
}

/**
 * La guia ESTATICA del orden de firma (deuda #2, pieza 1): UX sobre reglas que
 * ya existian, sin correr nada. Cubre (a) y (b); la interaccion sin fichero
 * comun —(c), lo del 2-oct— no se ve desde aqui: para eso esta la sonda de la
 * tanda. El orden mantiene los grupos ADYACENTES: firmarlos seguidos acorta la
 * ventana en la que el delta del destino cruza al resto del grupo.
 */
export function ordenDeFirma(tanda: readonly PropuestaDeTanda[]): GuiaDeOrden {
  const dependencias = tanda.filter((p) => tocaDependencias(p.files)).map((p) => p.id)
  const fuera = new Set(dependencias)
  const todos = componentes(tanda)
  const orden = [...todos.flat().filter((id) => !fuera.has(id)), ...dependencias]
  return { orden, grupos: todos.filter((g) => g.length > 1), dependencias }
}
