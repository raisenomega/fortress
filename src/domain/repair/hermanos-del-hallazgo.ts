import type { Candidate } from './select-target'

/** Lo minimo de otro hallazgo abierto para reconocerlo como hermano. */
export interface Hermano {
  readonly id: string
  readonly tipo: string | null
  readonly file: string
  readonly line: number | null
  readonly title: string
}

/** Cuantos se citan. Mas que esto deja de ser contexto y empieza a ser ruido. */
const MAX = 5

const donde = (h: Hermano): string => (h.line === null ? h.file : `${h.file}:${h.line}`)

/**
 * Los OTROS hallazgos abiertos del proyecto que son de la misma CLASE que este.
 *
 * El mismo defecto vive muchas veces en sedes distintas —el spawn sin acotar
 * entorno estaba en tres ficheros del motor, y el carril sin tomar tenia dos
 * bocas— y el escaner los emite como expedientes independientes. Sin esta
 * linea, cada uno se analiza desde cero reconstruyendo el mismo contexto, y el
 * analista no puede ni decir "esto es una sede de un defecto repartido", que es
 * justo lo que decide si arreglar aqui cierra algo o solo tapa un cuarto.
 *
 * La clase sale del vocabulario cerrado (ADR-067), asi que agrupar por ella
 * significa lo mismo en todos los hallazgos; agrupar por titulo no significaria
 * nada, porque el titulo se redacta distinto cada vez.
 *
 * Se dice explicitamente que NO los arregle: la correa del fix se calcula desde
 * el ancla de ESTE hallazgo, y tocar los hermanos seria salirse de ella.
 */
export function hermanosDelHallazgo(t: Candidate, abiertos: readonly Hermano[]): string | null {
  if (t.tipo === null) return null
  const hermanos = abiertos.filter((h) => h.id !== t.id && h.tipo === t.tipo)
  if (hermanos.length === 0) return null
  const citados = hermanos.slice(0, MAX).map((h) => `${donde(h)} — ${h.title}`)
  const resto = hermanos.length > MAX ? ` (y ${hermanos.length - MAX} mas)` : ''
  return [
    `Otros ${hermanos.length} hallazgos abiertos son de esta MISMA clase (${t.tipo})${resto}:`,
    ...citados,
    'Si es el mismo defecto repartido en varias sedes, dilo en "notes". NO los',
    'arregles ni los cites como where: la correa de este fix sale de su ancla.'
  ].join('\n')
}
