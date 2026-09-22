import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'

export interface ItemARetipar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
}

/**
 * El re-tipado de ADR-100, por LOTE: los hallazgos que el escaner dejo en `otro`
 * porque el vocabulario no tenia sitio para ellos. Ahora lo tiene —los seis de
 * auditoria— y cada uno recibe su clase con la regla de eleccion entera
 * (ADR-081: definiciones y desempates), elegida SOLO de la lista.
 *
 * NO juzga si el defecto sigue vivo (eso es el paso B, ADR-087) y NO toca
 * titulo, severidad ni simbolo: solo la clase. Y `otro` sigue siendo un destino
 * honesto: forzar un tipo que no es seria volver a mentir con otra palabra.
 */
export function promptDeRetipado(items: readonly ItemARetipar[]): string {
  return [
    `Clasifica ${items.length} hallazgos que FORTRESS tiene registrados con tipo "otro" porque`,
    'su vocabulario no tenia clase para ellos. Ahora la tiene. Lee el fichero y la linea',
    'de CADA uno antes de decidir, y devuelve para cada uno su tipo.',
    '',
    '- tipo: ELIGE uno de la lista, con su definicion, y desempata como se indica. Si de',
    '  verdad no encaja en ninguno, pon "otro" y di por que en "razon": es preferible a',
    '  forzar un tipo que no es. Un hallazgo puede ser de un tipo de seguridad que ya',
    '  existia y que en su dia se dejo en "otro": eligelo igual.',
    BLOQUE_DE_TIPOS,
    '- razon: una frase, en espanol, con lo que viste en el fichero.',
    'NO cambies el titulo, la severidad ni el simbolo. NO juzgues si el defecto sigue',
    'vivo: eso es otro paso.',
    '',
    'LOS HALLAZGOS:',
    JSON.stringify(items, null, 1),
    '',
    'Termina con UN bloque ```json {"retipadas":[{"id":"…","tipo":"…","razon":"…"}]}``` y',
    'nada despues.'
  ].join('\n')
}
