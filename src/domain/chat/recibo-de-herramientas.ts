import { redactSecrets } from './tool-detail'

/**
 * El recibo: QUE corrio el agente, no solo que uso Bash (ADR-093 §3).
 *
 * `tools` guarda NOMBRES —`Bash`, `Read`— y con la correa puesta eso bastaba:
 * con tres comandos posibles, saber «corrio Bash» ya decia cual. Al caer la
 * correa esa equivalencia se rompe, y un recibo de 160 `Bash` sin comandos es
 * un extracto que dice «160 movimientos» sin importes ni destinatarios.
 *
 * Es el gemelo de `denials` en `code-agent.ts:36-38` —que lleva el comando
 * porque el operador necesita leerlo— y NO de `deniedTools`, que va sin el
 * porque alimenta lo que FORTRESS aprende (cerco ADR-085). El recibo es para
 * el operador. No entra en el camino de auto-mejora.
 */

/**
 * Techo FORENSE, no cosmetico. Los 120 de `toolDetail` son politica de VISTA:
 * cortan y ponen `'...'`, que se lee como un comando entero cuando no lo es —la
 * misma trampa que `desconocida` leida como verde (ADR-091). Aqui el techo esta
 * tan alto que ningun comando real lo alcanza, y si alguno lo alcanza el recibo
 * LO DICE en vez de fingir que esta completo.
 */
export const TECHO_FORENSE = 4096

/** Lo que se añade cuando se alcanza el techo. Nunca un `'...'` mudo. */
export const cortado = (largo: number): string => ` · [CORTADO a ${TECHO_FORENSE} de ${largo}]`

/** Una linea del recibo. Sin detalle es solo el nombre: no se inventa nada. */
export function entradaDelRecibo(herramienta: string, detalle?: string): string {
  return detalle === undefined || detalle === '' ? herramienta : `${herramienta}: ${detalle}`
}

/**
 * El recibo listo para PERSISTIR: tachado entero y para TODAS las herramientas.
 *
 * Esta funcion es el innegociable del ADR-093 §3.4. Hoy solo `Bash` pasa por
 * `redactSecrets` (`tool-detail.ts:57-60`); el `query` de un MCP, el `pattern`
 * de un Grep o el `path` de un Read salen en crudo, y hoy es seguro SOLO porque
 * el detalle va al vivo, envuelto en `sinSecretosEnVivo`. El recibo no pasa por
 * ese envoltorio ni por `finishTurn` —que tacha `outcome.text`, no las
 * herramientas—, asi que sin esto seria el UNICO campo persistido de FORTRESS
 * sin redaccion: R1, y de lo que no se deshace.
 *
 * Se tacha ANTES de cortar, nunca al reves: cortar primero puede dejar media
 * credencial que ya no casa con ningun patron, y entonces se escribe.
 */
export function tacharRecibo(entradas: readonly string[]): readonly string[] {
  return entradas.map((entrada) => {
    const tachada = redactSecrets(entrada)
    if (tachada.length <= TECHO_FORENSE) return tachada
    return tachada.slice(0, TECHO_FORENSE) + cortado(tachada.length)
  })
}
