/**
 * Por que un hallazgo de la lista no se llego a verificar. Vocabulario CERRADO,
 * y son DOS porque son dos cosas distintas que el operador tiene que poder
 * distinguir:
 *
 *   no-mitigado    no estaba en el limbo: verificar no aplica, no se gasto nada
 *   ya-trabajado   esta mitigado, pero una propuesta viva lo tiene cogido
 *
 * Nacieron separadas al abrir la seleccion manual. Hasta entonces la lista la
 * construia `filter(mitigado)` y el unico omitido posible era el segundo, asi
 * que una sola casilla decia la verdad. Con el operador eligiendo filas a mano,
 * un no-mitigado colado se habria anunciado como «ya lo trabaja una propuesta»:
 * una frase falsa, sobre un hallazgo que ni siquiera se toco.
 *
 * La defensa vive AQUI y no en la UI. La pantalla puede equivocarse —y de hecho
 * puede cambiar manana— pero el parte no puede mentir sobre lo que hizo.
 */
export const MOTIVOS_DE_OMISION = ['no-mitigado', 'ya-trabajado'] as const

export type MotivoDeOmision = (typeof MOTIVOS_DE_OMISION)[number]
