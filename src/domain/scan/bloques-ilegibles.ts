import { FENCE } from './redactar-transcript'

/**
 * Los indices (1-based) de los bloques ```json de un texto que NO re-parsean.
 *
 * Es el detector del guard de `write-scan-log`: lo persistido se re-parsea, o
 * se NOMBRA. Existe porque «ilegible pasa en silencio» ya costo dos veces — el
 * informe del escaner (DEUDAS 9.2) y el crudo mordido por una regla glotona
 * (PASO 69, 5 de 13 logs) — y porque la clase «regla nueva que se desboca»
 * volvera: el detector es la red, no la regla de hoy.
 */
export function bloquesIlegibles(texto: string): readonly number[] {
  const rotos: number[] = []
  let indice = 0
  for (const m of texto.matchAll(FENCE)) {
    indice += 1
    try {
      JSON.parse(m[1])
    } catch {
      rotos.push(indice)
    }
  }
  return rotos
}
