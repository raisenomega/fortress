import { sanearParaPrompt } from '../shared/sanear-para-prompt'

/**
 * Lo que el TRIBUNAL encontro, convertido en el mensaje siguiente para el
 * productor (ADR-096, Fase B).
 *
 * Es el gemelo de `vetoComoPedido`, y la diferencia es el numero: aquel lleva
 * UN veto de OMEGA —la voz que cierra—, este lleva N objeciones de criticos
 * —las voces que atacan—. Por eso nace tomando una lista aunque hoy se pruebe
 * con una sola: extender a N no debe ser un cambio de forma, solo mas entradas.
 *
 * Las objeciones llegan NUMERADAS y enteras, nunca resumidas. En el escaneo se
 * resume a proposito —`summarize` cruza `severidad fichero: titulo` para no
 * duplicar hallazgos— pero aqui la PROSA ES LA SUSTANCIA: lo que el productor
 * tiene que responder es el razonamiento, no el titular (ADR-096 §13.4).
 *
 * Que sean N y se vean numeradas tambien importa: el productor debe saber que
 * son FRENTES INDEPENDIENTES —los criticos no se leyeron entre si (§11.3)— y
 * no una opinion repetida. Tres objeciones distintas pesan lo que tres; la
 * misma objecion tres veces no existe, porque nadie la copio de nadie.
 *
 * Las escribio un agente sobre codigo del proyecto auditado, asi que cada una
 * entra por `sanearParaPrompt`, como todo lo que no es texto nuestro.
 */
export function objecionesComoPedido(objeciones: readonly string[]): string | null {
  // `null` y no cadena vacia: sin objeciones NO hay reintento que pedir, y
  // devolver texto vacio dejaria mandar al productor un mensaje en blanco. El
  // tipo obliga a que quien llame decida que hacer cuando el tribunal no
  // encontro nada — que es, justamente, la senal de que el fix aguanta.
  if (objeciones.length === 0) return null

  const cuantas = objeciones.length
  return [
    cuantas === 1
      ? 'Tu fix fue revisado por un CRITICO, que encontro esto:'
      : `Tu fix fue revisado por ${cuantas} CRITICOS independientes. Cada uno lo`,
    ...(cuantas === 1 ? [] : ['miro por su cuenta, sin ver lo que decian los otros:']),
    '',
    ...objeciones.flatMap((objecion, i) => [`[${i + 1}] ${sanearParaPrompt(objecion)}`, '']),
    'Responde a CADA UNA: corrige lo que tenga razon, y lo que no la tenga',
    'rebatelo con evidencia —archivo:linea— en vez de ignorarlo. Una objecion',
    'sin contestar cuenta como aceptada.'
  ].join('\n')
}
