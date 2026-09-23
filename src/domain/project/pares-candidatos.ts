export interface FilaDelPar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly simbolo: string | null
  readonly title: string
  readonly identity: string
  readonly firstSeen: string
  readonly severity: string
}

export interface Par {
  /** Los dos ids ordenados, unidos por `+`: estable entre corridas. */
  readonly id: string
  readonly a: FilaDelPar
  readonly b: FilaDelPar
}

const simbolo = (f: FilaDelPar): string | null => {
  const s = (f.simbolo ?? '').trim().toLowerCase()
  return s === '' ? null : s
}

/** Misma sede (fichero y simbolo) o misma linea exacta, siempre dentro del mismo fichero. */
const candidatos = (a: FilaDelPar, b: FilaDelPar): boolean => {
  if (a.file !== b.file) return false
  const sa = simbolo(a),
    sb = simbolo(b)
  if (sa !== null && sb !== null && sa === sb) return true
  return a.line !== null && a.line === b.line
}

/**
 * Los pares que un JUICIO tiene que mirar (ADR-101 §5): los 90 de misma sede y
 * los 32 de misma linea medidos el 2026-09-22, y ninguno mas. La sede propone;
 * nunca decide: fundir por sede fundiria defectos reales distintos (medido:
 * `create-checkout` con seis tipos en un mismo `serve`). Cada par sale una
 * sola vez, con sus ids ordenados.
 */
export function paresCandidatos(vivas: readonly FilaDelPar[]): readonly Par[] {
  const ordenadas = [...vivas].sort((x, y) => x.id.localeCompare(y.id))
  const pares: Par[] = []
  for (let i = 0; i < ordenadas.length; i++) {
    for (let j = i + 1; j < ordenadas.length; j++) {
      const a = ordenadas[i],
        b = ordenadas[j]
      if (a !== undefined && b !== undefined && candidatos(a, b)) pares.push({ id: `${a.id}+${b.id}`, a, b }) // prettier-ignore
    }
  }
  return pares
}
