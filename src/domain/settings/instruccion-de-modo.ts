import type { OperationMode } from './operation-mode'

/**
 * Lo que se le dice al agente sobre su modo. Vive en el dominio para que lo
 * usen las dos rutas: el system prompt de la API y el prompt de cada paso del
 * workflow. Antes solo lo tenia la API, asi que en un workflow el agente no
 * sabia en que modo estaba y respondia "supervisado por defecto" aunque el
 * operador lo hubiera puesto en autonomo.
 *
 * LO QUE EL AUTONOMO YA NO DICE, y por que no vuelve (ADR-089, ENMIENDA 1).
 *
 * Decia dos frases mas, y las dos se retiraron en la Fase B, punto 5:
 *
 * 1. «NUNCA toques auth, payments, RLS ni seguridad sin volver a supervisado.»
 *    Es LA LISTA DE PALABRAS que ADR-089 retiro — subcontratada al modelo en vez
 *    de ejecutada por el codigo. Sobrevivio un mes EN ESTE MISMO FICHERO, que es
 *    el que aquel ADR estaba limpiando: se borro el mecanismo y se dejo la orden.
 *    Y «volver a supervisado» le pide al agente rebotarle la decision a un humano
 *    que en autonomo NO ESTA — el autonomo comportandose como supervisado, dicho
 *    en el prompt. Sobre una herramienta cuyos hallazgos SON de seguridad,
 *    «nunca toques seguridad» le prohibe aquello para lo que existe.
 *
 * 2. «Si algo falla, revierte.» La reversion es `conRedDeReversion` (ADR-079):
 *    un checkpoint por intento, ABAJO, donde no se puede esquivar. Pedirsela al
 *    agente duplica una garantia que ya existe, y un agente que revierte a mano
 *    puede deshacer justo lo que la red iba a conservar.
 *
 * Lo que queda DICE QUE HACER y no prohibe por palabra. Si alguien echa de menos
 * un limite aqui, el limite no va en el prompt: va en el codigo, donde no
 * depende de la buena voluntad de quien lo lee.
 */
export const MODE_INSTRUCTION: Record<OperationMode, string> = {
  supervisado:
    'MODO SUPERVISADO: propon los cambios y espera aprobacion. No apliques nada ' +
    'sin confirmacion. Muestra el impacto antes de cada cambio.',
  autonomo:
    'MODO AUTONOMO: aplica los cambios y reporta resultados. Corre los tests antes y despues.'
}
