import type { Candidate } from './select-target'

/**
 * De que CLASE es el defecto y DONDE vive, que son las dos senas con las que
 * FORTRESS reconoce un hallazgo entre escaneos y las dos que el analista no
 * recibia. Le llegaba `titulo` y `fichero:linea` —lo que se redacta distinto
 * cada vez y lo que se mueve al editar el fichero— y no lo estable.
 *
 * El coste era concreto: con el ancla sola, un defecto que es una AUSENCIA
 * repartida entre capas no se puede verificar, porque en esa linea no hay nada
 * que mirar. El simbolo dice que bloque tiene el problema aunque la linea ya no
 * cuadre; el tipo dice de que clase es, y esa clase sale de un vocabulario
 * cerrado, asi que significa lo mismo en todos los hallazgos.
 *
 * Se declara que el simbolo viene NORMALIZADO. Callarlo lo haria peor que no
 * darlo: el agente buscaria `graph_tool_rule` literal en un fichero que dice
 * `GRAPH_TOOL_RULE`, no lo encontraria, y concluiria que ya no esta — que es
 * exactamente el falso OBSOLETO que la red de la extincion existe para impedir.
 *
 * Sin senas no se escribe nada. Ciento veintisiete hallazgos de la base llevan
 * la clave del formato anterior y no las tienen; inventarles un tipo seria peor
 * que el silencio.
 */
export function senasDelHallazgo(t: Candidate): readonly string[] {
  if (t.tipo === null && t.simbolo === null) return []
  const tipo = t.tipo === null ? [] : [`Clase del defecto: ${t.tipo} (vocabulario cerrado).`]
  const simbolo =
    t.simbolo === null
      ? []
      : [`Vive en el simbolo "${t.simbolo}", en minusculas: buscalo sin distinguir mayusculas.`]
  return ['', ...tipo, ...simbolo]
}
