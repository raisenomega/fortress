import { sanearCampoDePrompt } from '../shared/sanear-campo-de-prompt'

/**
 * La objecion de OMEGA convertida en el encargo de la vuelta siguiente
 * (ADR-110). Va sobre la sesion REANUDADA, asi que el generador ya recuerda lo
 * que hizo: aqui solo llega lo que falta y el encargo de cerrarlo.
 *
 * NO ES UN VETO, y el texto no puede decir que lo es: por D19 un `PARCIAL`
 * APRUEBA. Decirle «fue vetado» —como hace `vetoComoPedido` en el Terminal, que
 * si nace de un veto— le mentiria sobre su propio trabajo y le invitaria a
 * deshacerlo en vez de completarlo. Lo hecho se queda; se anade lo que falta.
 *
 * La razon la escribio un agente leyendo codigo del proyecto auditado, asi que
 * entra por el saneador como todo lo que no es texto nuestro. Por
 * `sanearCampoDePrompt`: aplana Y neutraliza las marcas, porque va DENTRO de un
 * bloque, y aplanar solo impide abrir una linea, no cerrar el bloque desde la
 * misma (ADR-115: el gemelo del encargo del rojo). Sin el tope de 200: la razon
 * es el dato que la vuelta necesita (la de la 7998aa13 medía 606 caracteres).
 */
export function objecionComoEncargo(razon: string): string {
  return [
    '<objecion_del_revisor>',
    'Tu fix anterior fue APROBADO, pero resuelve el hallazgo solo PARCIALMENTE.',
    'Lo que el revisor dejo escrito, literal:',
    sanearCampoDePrompt(razon),
    '</objecion_del_revisor>',
    '',
    'COMPLETA lo que falta, sin deshacer lo que ya funciona y sin salir de los',
    'archivos permitidos. Si lo que falta no cabe en ellos, dilo y no lo fuerces.'
  ].join('\n')
}
