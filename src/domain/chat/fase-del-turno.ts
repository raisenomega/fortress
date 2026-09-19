/**
 * En que anda el turno ahora mismo, para que el operador lo vea (ADR-097).
 *
 * El medidor enseñaba tiempo, tokens y coste — lo que se GASTA— pero nunca lo
 * que se HACE. En el ensayo del 18-sep eso significo mirar seis minutos de
 * cronometro mientras un critico navegaba el codigo por $1.93, sin saberlo.
 *
 * Es una union que CRECE: hoy solo el debate; el juicio de OMEGA entra con su
 * propia pieza. Se nombra por lo que el turno esta haciendo, nunca por su color
 * —el color lo decide la presentacion, y un dominio que dice «naranja» no puede
 * cambiar de tema sin mentir—.
 */
export type FaseDelTurno = 'debate'

/**
 * Lo que se lee en la barra. Un mapa y no un `switch` para que una fase nueva
 * NO compile hasta que alguien decida como se lee: el hueco se nota.
 *
 * El numero son los agentes del turno: en uno juzgado son tres y el debate es
 * cosa de los tres —el productor propuso, el critico ataca, OMEGA arbitrara—,
 * no solo de quien ataca.
 */
const ETIQUETA: Record<FaseDelTurno, (agentes: number) => string> = {
  debate: (agentes) => `Debate · ${agentes} agentes`
}

export function etiquetaDeFase(fase: FaseDelTurno, agentes: number): string {
  return ETIQUETA[fase](agentes)
}
