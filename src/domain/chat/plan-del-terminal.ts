import type { HallazgoJuzgado } from '../repair/hallazgo-juzgado'
import type { HallazgoAResolver } from './hallazgo-a-resolver'

/**
 * El plano que el Terminal le da a OMEGA (ADR-090, Fase A). En el Motor esto
 * sale del analista, que estudia el hallazgo y escribe los cinco campos; el
 * Terminal no tiene analista: tiene el hallazgo releido de la base y lo que el
 * operador pidio.
 *
 * SE DICE LO QUE HAY Y NO MAS. `patternToCopy` va vacio a proposito: el Terminal
 * no impone un patron, y rellenarlo con una frase de relleno haria que OMEGA
 * juzgara contra una restriccion que nadie puso — un fix correcto saldria vetado
 * por no copiar un patron inventado. Un campo vacio es una restriccion ausente;
 * una inventada es una mentira con forma de exigencia.
 *
 * Lo que OMEGA si puede contestar con esto es la pregunta que importa: ¿este
 * diff resuelve ESTE hallazgo sin tocar lo que no venia al caso?
 */
export function planDelTerminal(foco: HallazgoAResolver, pedido: string): HallazgoJuzgado {
  return {
    target: { title: foco.title, file: foco.file, line: foco.line },
    whatToChange: pedido,
    where: foco.line === null ? foco.file : `${foco.file}:${foco.line}`,
    patternToCopy: '',
    doNotTouch: 'lo que no tenga que ver con este hallazgo',
    risk: `severidad ${foco.severity}`
  }
}
