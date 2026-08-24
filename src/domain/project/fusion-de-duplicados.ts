/**
 * Cuando DOS FILAS resultan ser el mismo defecto.
 *
 * Las filas anteriores a cp116 llevan una identidad de otra formula
 * —severidad│fichero│titulo— que no puede empatar con la de hoy. Mientras el
 * escaneo vuelva a nombrar el defecto, abre fila nueva y la vieja se queda viva
 * al lado: dos filas puntuando el mismo problema. El backfill las reclasifica y
 * ahi las dos identidades coinciden; alguien tiene que decidir cual es cual.
 *
 * No lo hace el sync: `sync` compara el escaneo contra la base, nunca filas de
 * la base entre si. Y dejarlas con la misma clave seria PEOR que hoy —
 * `SELECT_BY_IDENTITY` devuelve una al azar, el escaneo la refresca, y la otra
 * queda viva sin que nada vuelva a tocarla ni a matarla.
 */

/** Lo minimo para decidir una fusion. Nada mas: decidir no necesita el resto. */
export interface FilaAFusionar {
  readonly id: string
  /** Ya en formato de hoy: fichero│tipo│simbolo. */
  readonly identidad: string
  readonly firstSeen: string
}

export interface Fusion {
  readonly ganadora: string
  readonly absorbidas: readonly string[]
  readonly identidad: string
}

/** El centinela que retira de circulacion la identidad de la absorbida.
 *  NO se vacia a '': una identidad vacia cae en el PENDING de la migracion de
 *  memoria y volveria a recalcularse en el arranque siguiente. */
export function identidadFusionada(ganadora: string, identidadVieja: string): string {
  return `fusionada:${ganadora}|${identidadVieja}`
}

/** La que se queda es la que lleva mas tiempo: su `first_seen` es la historia
 *  real del defecto. A igualdad de fecha manda el id, para que dos corridas
 *  sobre los mismos datos decidan lo mismo. */
function mayor(a: FilaAFusionar, b: FilaAFusionar): FilaAFusionar {
  if (a.firstSeen !== b.firstSeen) return a.firstSeen < b.firstSeen ? a : b
  return a.id < b.id ? a : b
}

/**
 * Que fusionar y con quien. SOLO agrupa por identidad COMPLETA: fichero, tipo y
 * simbolo. Por fichero a secas fundiria defectos distintos del mismo archivo —
 * en `claude-cli.ts` hay cinco filas que son tres problemas—, y colapsar de mas
 * borra trabajo vivo, que es peor que no colapsar.
 *
 * Una identidad con una sola fila no sale en el plan: no hay nada que decidir.
 */
export function planDeFusion(filas: readonly FilaAFusionar[]): readonly Fusion[] {
  const porIdentidad = new Map<string, FilaAFusionar[]>()
  for (const fila of filas) {
    const grupo = porIdentidad.get(fila.identidad)
    if (grupo) grupo.push(fila)
    else porIdentidad.set(fila.identidad, [fila])
  }

  const plan: Fusion[] = []
  for (const [identidad, grupo] of porIdentidad) {
    if (grupo.length < 2) continue
    const ganadora = grupo.reduce(mayor)
    const absorbidas = grupo.filter((f) => f.id !== ganadora.id).map((f) => f.id)
    plan.push({ ganadora: ganadora.id, absorbidas, identidad })
  }
  return plan
}
