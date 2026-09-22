import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'
import { REGLA_DEL_SIMBOLO } from './report-contract'

export interface ItemAVerificar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
}

/**
 * El juicio del paso B, por LOTE: lo mismo que el analista decide de uno en uno
 * (ADR-087) —REAL u OBSOLETO, y si OBSOLETO la evidencia con marcador literal y
 * forma, que FORTRESS comprueba por su cuenta en el fichero de hoy— para un
 * puñado de hallazgos en una sola llamada. Y el tipo, con la regla de eleccion
 * entera (ADR-081): las que sigan vivas dejan de ser `otro` por defecto.
 *
 * NO pide titulo ni severidad: el titulo se reescribe cada corrida y la
 * severidad mueve el score; esta pieza juzga, no repinta el tablero.
 */
export function promptDeVerificacionPorLote(items: readonly ItemAVerificar[]): string {
  return [
    `Juzga ${items.length} hallazgos que FORTRESS tiene registrados y que nadie ha vuelto a`,
    'comprobar. Lee el fichero y la linea de CADA uno antes de decidir. Para cada uno',
    'devuelve "status" REAL —el defecto sigue en el codigo— u OBSOLETO —ya no esta—, su',
    'tipo y su simbolo. NO cambies el titulo ni la severidad.',
    '',
    'Si el status es "OBSOLETO", la clave "evidencia" es OBLIGATORIA: es lo UNICO que',
    'cierra un hallazgo. Lleva {"marcador","forma"}. El "marcador" es una cadena LITERAL',
    'que FORTRESS buscara por su cuenta en el fichero del hallazgo; "forma" dice que',
    'espera encontrar: "ausente" si el marcador es la huella del defecto y ya no esta,',
    '"presente" si es el control que lo tapa y ahora si esta. Elige el marcador que se',
    'romperia si el defecto volviera, no el mas comodo. Si la evidencia no cuadra contra',
    'el fichero, el hallazgo NO se cierra. Argumentar que tocarlo es arriesgado NO es',
    'evidencia de que el defecto no este; si el defecto sigue, el status es "REAL".',
    '',
    '- tipo: ELIGE uno de la lista, con su definicion, y desempata como se indica. Si de',
    '  verdad no encaja, pon "otro": es preferible a forzar un tipo que no es.',
    BLOQUE_DE_TIPOS,
    REGLA_DEL_SIMBOLO,
    '- razon: una frase, en espanol, con lo que viste en el fichero.',
    '',
    'LOS HALLAZGOS:',
    JSON.stringify(items, null, 1),
    '',
    'Termina con UN bloque ```json {"juzgados":[{"id":"…","status":"REAL|OBSOLETO","tipo":"…",',
    '"simbolo":"…","evidencia":{"marcador":"…","forma":"ausente|presente"},"razon":"…"}]}```',
    'y nada despues. "evidencia" solo en los OBSOLETO.'
  ].join('\n')
}
