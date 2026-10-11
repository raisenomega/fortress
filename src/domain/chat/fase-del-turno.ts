/**
 * En que anda el turno ahora mismo, para que el operador lo vea (ADR-097).
 *
 * El medidor enseñaba tiempo, tokens y coste — lo que se GASTA— pero nunca lo
 * que se HACE. En el ensayo del 18-sep eso significo mirar seis minutos de
 * cronometro mientras un critico navegaba el codigo por $1.93, sin saberlo.
 *
 * Se nombra por lo que el turno esta haciendo, nunca por su color
 * —el color lo decide la presentacion, y un dominio que dice «naranja» no puede
 * cambiar de tema sin mentir—.
 */
export type FaseDelTurno = 'debate' | 'juicio' | 'plan' | 'contexto' | 'bloque'

/**
 * Lo que se lee en la barra. Un mapa y no un `switch` para que una fase nueva
 * NO compile hasta que alguien decida como se lee: el hueco se nota.
 *
 * El numero son los agentes del turno: en uno juzgado son tres y el debate es
 * cosa de los tres —el productor propuso, el critico ataca, OMEGA arbitrara—,
 * no solo de quien ataca.
 */
const ETIQUETA: Record<FaseDelTurno, (agentes: number) => string> = {
  debate: (agentes) => `Debate · ${agentes} agentes`,
  // El juicio no lleva numero: juzga UNO, y decir «3 agentes» mientras solo
  // trabaja OMEGA seria contar el turno en vez de contar lo que pasa ahora.
  juicio: () => 'Consultando a OMEGA',
  // Tampoco lleva numero, y por lo mismo: juzga OMEGA sola. Se nombra el PLAN y
  // no el diff porque es lo que tiene delante —el diff aun no existe—, y la
  // palabra «verificacion» es deliberada: dice que alguien lo esta mirando, sin
  // prometer la dureza del juicio del fix (ADR-097 §2.3).
  plan: () => 'Plan en verificacion por OMEGA',
  // El CTO (PASO 158): dos fases SIN agentes — reune su contexto (grafo+libro) y
  // escribe el PASO. El numero no aplica; su progreso lo pintan los chips.
  contexto: () => 'Reuniendo contexto',
  bloque: () => 'Escribiendo el PASO'
}

export function etiquetaDeFase(fase: FaseDelTurno, agentes: number): string {
  return ETIQUETA[fase](agentes)
}
