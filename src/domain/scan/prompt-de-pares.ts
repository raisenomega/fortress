export interface FilaDelPrompt {
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly simbolo: string | null
  readonly title: string
}
export interface ParDelPrompt {
  readonly id: string
  readonly a: FilaDelPrompt
  readonly b: FilaDelPrompt
}

const sitio = (f: FilaDelPrompt): string =>
  `${f.file}:${f.line ?? '-'} · tipo=${f.tipo}${f.simbolo ? ` · simbolo=${f.simbolo}` : ''} · "${f.title}"`

/**
 * El juicio del lote (ADR-101 §5): por cada par de filas de la MISMA sede o la
 * MISMA linea, ¿son el mismo defecto o dos distintos? Fail-closed a DISTINTOS:
 * medido, la mayoria de los pares de sede son defectos reales distintos, y
 * fundir de mas borra trabajo vivo, que es peor que no fundir.
 */
export function promptDePares(pares: readonly ParDelPrompt[]): string {
  const lista = pares.map((p) =>
    JSON.stringify({ par: p.id, A: sitio(p.a), B: sitio(p.b) }, null, 1)
  )
  return [
    `Juzga ${pares.length} PARES de hallazgos que FORTRESS tiene registrados en el mismo sitio.`,
    'Lee el fichero y las dos lineas de CADA par antes de decidir. Para cada par responde',
    '"veredicto": "MISMO" SOLO si las dos filas describen el MISMO defecto —misma causa raiz,',
    'un solo arreglo los cierra a los dos— aunque los titulos o los tipos difieran. Si son',
    'dos defectos distintos, dos facetas con arreglos distintos, o si no estas seguro, "DISTINTOS".',
    'Fundir de mas borra trabajo vivo; dejar dos filas no borra nada. NO cambies titulos ni tipos.',
    '- razon: una frase, en espanol, con lo que viste en el fichero.',
    '',
    'LOS PARES:',
    ...lista,
    '',
    'Termina con UN bloque ```json {"pares":[{"par":"…","veredicto":"MISMO|DISTINTOS","razon":"…"}]}```',
    'y nada despues.'
  ].join('\n')
}
