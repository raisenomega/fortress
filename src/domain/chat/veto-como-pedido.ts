import { sanearParaPrompt } from '../shared/sanear-para-prompt'

/**
 * El veto de OMEGA convertido en el mensaje siguiente para el productor
 * (ADR-090, Fase A). Va sobre la sesion reanudada, asi que el productor ya
 * recuerda lo que intento: aqui solo llega la objecion y el encargo de
 * atenderla. Sin eso el reintento seria otro intento a ciegas, y dos intentos a
 * ciegas no convergen.
 *
 * La razon la escribio un agente sobre codigo del proyecto auditado, asi que
 * entra por `sanearParaPrompt` como todo lo que no es texto nuestro.
 */
export function vetoComoPedido(razon: string): string {
  return [
    'Tu cambio anterior fue REVISADO y VETADO. La objecion, literal:',
    '',
    sanearParaPrompt(razon),
    '',
    'Corrige el fix atendiendo a ESA objecion concreta. No repitas el mismo',
    'cambio: si vuelves a proponer lo mismo, el ciclo se cierra sin resolver.'
  ].join('\n')
}
