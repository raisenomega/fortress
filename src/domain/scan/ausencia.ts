import type { FindingMemory } from '../project/finding-memory'

/**
 * Los hallazgos vivos que ESTE escaneo no nombro. No mueren: siguen en el
 * tablero, puntuando, y a la espera de que alguien los mire.
 *
 * Aqui hubo una extincion automatica: un ausente cuyo ARCHIVO hubiera cambiado
 * segun git se daba por resuelto. La segunda prueba parecia bastante y no lo
 * era. En un repo en desarrollo activo casi todo archivo cambia todas las
 * semanas, asi que "el archivo cambio" se cumplia por defecto y la regla
 * degeneraba en "la ausencia extingue" — que es justo lo que esa prueba existia
 * para impedir. Mato dos hallazgos de la CSP porque alguien anadio un COMENTARIO
 * al archivo; el `unsafe-inline` que denunciaban sigue en main.
 *
 * La ausencia ya no dice nada. El escaner es un LLM leyendo codigo: no nombrar
 * algo no es afirmar que no esta, y ni siquiera se repite la misma redaccion
 * entre corridas. Un hallazgo solo muere cuando un agente lo MIRA y dictamina
 * que ya no aplica. Ver `veredicto-del-analisis` y `plan-repair`.
 */
export function ausentes(
  memory: readonly FindingMemory[],
  reported: ReadonlySet<string>
): readonly FindingMemory[] {
  return memory.filter((f) => f.lifecycle === 'ACTIVE' && !reported.has(f.identity))
}

/**
 * Si el ULTIMO escaneo del proyecto volvio a nombrar el hallazgo.
 *
 * Derivado, no un estado: el hallazgo sigue ACTIVE lo confirme quien lo
 * confirme, y por eso el motor lo sigue viendo y el score lo sigue contando.
 * Meter un cuarto valor en `lifecycle` habria obligado a repasar los cinco
 * sitios que filtran por ACTIVE, y olvidar uno solo dejaria al motor ciego ante
 * decenas de hallazgos sin que nadie se enterara.
 *
 * Sin escaneo previo nada esta reconfirmado, y es honesto: no se ha mirado.
 */
export function confirmadoPorUltimoEscaneo(lastSeen: string, lastScan: string | null): boolean {
  if (lastScan === null || lastScan === '' || lastSeen === '') return false
  return lastSeen >= lastScan
}
