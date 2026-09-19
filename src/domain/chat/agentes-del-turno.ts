/**
 * Cuantos agentes intervienen en un turno del Terminal (ADR-097, punto 1).
 *
 * El medidor de la barra ya sabe pintar «X/N agentes» —lo hace en los workflows
 * de escaneo— pero el turno con foco le manda SIEMPRE un 1, asi que se queda
 * mudo justo cuando mas gente trabaja. En el ensayo del 18-sep corrieron TRES
 * —productor, critico y OMEGA, 6m35 y $1.93 solo el critico— y la barra enseño
 * tiempo y tokens de UNO.
 *
 * El numero no se cuenta despues: se SABE antes, porque depende de como se
 * compuso el turno. Por eso vive aqui, en el dominio, y no de un contador que
 * alguien tenga que acordarse de incrementar en tres sitios.
 *
 * El productor siempre esta: sin el no hay turno. Los otros dos entran juntos o
 * no entran —el juicio es del autonomo con foco y red (ADR-090)— y el critico
 * ademas exige que alguien lo haya inyectado (ADR-096).
 */
export function agentesDelTurno(conJuicio: boolean, conCritico: boolean): number {
  if (!conJuicio) return 1
  return conCritico ? 3 : 2
}
