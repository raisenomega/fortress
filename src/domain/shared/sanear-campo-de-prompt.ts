import { aplanarParaPrompt } from './sanear-para-prompt'

/**
 * Las marcas que delimitan un bloque del prompt, neutralizadas.
 *
 * Vivia COPIADA CUATRO VECES —generador, OMEGA, critico y el juez del plan—,
 * byte a byte, y ese es exactamente el desfase que el saneador hermano describe
 * en su docblock: se arregla en un sitio y sigue roto en los otros tres.
 *
 * Se exporta sola porque el juez del plan la necesita SIN aplanar: lo que le
 * manda es la prosa que el productor escribio, y esa es el OBJETO del juicio,
 * como el diff. Aplanarla destruiria el plan que OMEGA tiene que leer.
 */
export function neutralizarMarcas(texto: string): string {
  return texto.replace(/</g, '(').replace(/>/g, ')').replace(/`/g, "'")
}

/**
 * Un CAMPO de prompt: los DOS controles, que no son el mismo.
 *
 * Medido el 2026-09-27 de punta a punta. `neutralizarMarcas` impide cerrar el
 * bloque —`<sistema>` sale `(sistema)`— pero NO impide forjar un campo, que no
 * necesita corchete alguno: un salto de linea normal en el titulo de un hallazgo
 * del repo auditado escribia `NO_TOCAR: nada` y `PERMITIDOS: todo el repo` como
 * lineas propias en el prompt del GENERADOR, el unico agente con permiso de
 * escritura, y el NO_TOCAR real aparecia despues, contradicho.
 *
 * El camino no lo corta nadie aguas arriba: el parser del informe del escaner y
 * el del analisis solo hacen `trim`. Se corta aqui.
 *
 * Sin tope de longitud, a proposito: `aplanarParaPrompt` es el control de
 * seguridad y el tope es otra cosa. `analysis_reason` llega a 1526 caracteres en
 * la base viva, y acotarlo mutilaria el analisis que el generador ejecuta.
 */
export function sanearCampoDePrompt(texto: string): string {
  return neutralizarMarcas(aplanarParaPrompt(texto))
}
