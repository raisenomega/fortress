/**
 * Lo que el autonomo dice cuando intento y NO pudo decidir solo (ADR-097 §3).
 *
 * ES DEL LOTE ENTERO, no de un hallazgo: el plan es la DIRECCION de los N, y sin
 * direccion aprobada no se ejecuta ninguno. No hay un hallazgo que apartar —
 * estan todos igual que antes, abiertos y sin tocar.
 *
 * EL TEXTO ES DE PERSONA, no de maquina. «No convergio» es jerga: dice como se
 * llama el fallo dentro, no que paso ni que falta. Es la honestidad del
 * `desconocida` (ADR-091 §2) aplicada al plan — lo grave no es que el autonomo
 * tenga un limite, es que lo diga de forma que nadie lo entienda y parezca otra
 * cosa. Aqui se admite en voz clara: lo intente, no pude, te toca.
 *
 * NO lleva nada del proyecto auditado: ni rutas, ni la razon de OMEGA, ni el
 * texto del plan. La misma linea que respeta `MotivoSinCierre` por ser un enum.
 */
export const DECISION_ABIERTA = 'Decision abierta — necesita un humano.'

/**
 * El parte del lote que se quedo sin direccion. Se dice QUE paso —se intento y
 * se agoto— y QUE falta —el criterio del operador—, en ese orden, porque quien
 * lo lee necesita saber primero que nadie toco su codigo.
 */
export function parteDeDecisionAbierta(hallazgos: number, intentos: number): string {
  const vueltas = intentos === 1 ? 'una vuelta' : `${intentos} vueltas`
  const plural = hallazgos === 1 ? '' : 's'
  return [
    DECISION_ABIERTA,
    `Propuse un plan y OMEGA lo reviso en ${vueltas}; al final volvia a la misma`,
    'propuesta, asi que dejo de intentarlo solo en vez de dar vueltas a tu costa.',
    `No se ha ejecutado nada: ${hallazgos} hallazgo${plural} sigue${plural === '' ? '' : 'n'} abierto${plural}, sin tocar.`, // prettier-ignore
    'Dime tu por donde empezar y sigo.'
  ].join(' ')
}
