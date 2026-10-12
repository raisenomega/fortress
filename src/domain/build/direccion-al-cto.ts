/** Lo minimo del hallazgo para nombrarlo al CTO: no acopla con `Finding` entero. */
interface HallazgoDirigible {
  readonly id: string
  readonly title: string
  readonly file: string
  readonly line: number | null
}

/**
 * ATERRIZAJE-3: la direccion que fija el QUE del CTO al hallazgo de la CABEZA de
 * la cola —el mismo que estara en el foco del Terminal—. El CTO sigue pensando
 * libre el COMO; esto solo le dice CUAL atacar, nombrandolo (id + titulo +
 * fichero:linea). Sin cabeza, o si no aparece entre los hallazgos vivos, ''
 * (direccion generica: el lazo entrega el input como hoy). Puro.
 */
export function direccionALaCabeza(
  cabezaId: string | null,
  findings: readonly HallazgoDirigible[]
): string {
  if (cabezaId === null) return ''
  const f = findings.find((x) => x.id === cabezaId)
  if (f === undefined) return ''
  const sede = f.line === null ? f.file : `${f.file}:${f.line}`
  return `Trabaja AHORA el hallazgo de la cabeza de la cola: ${f.id} — ${f.title} (${sede}). Tu PASO debe atacar ESE hallazgo, el que ya esta en el foco.`
}
