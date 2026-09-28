/**
 * La familia del SANEADO de texto ajeno que entra en el prompt de un agente.
 *
 * Sale a su propio modulo por lo mismo que sus hermanas: la lista de
 * `innegociables-defensa` llego a su techo de lineas, y el corte se hace por
 * FAMILIA y no por tamano. Aqui viven los dos controles de la misma puerta.
 *
 * `sanear-para-prompt` aplana: todo separador y control Unicode a un espacio,
 * para que un texto del repo auditado no pueda ABRIR una linea dentro del
 * prompt. `sanear-campo-de-prompt` aplana Y neutraliza las marcas, y existe
 * porque impedir cerrar el bloque no impide forjar un CAMPO: un salto de linea
 * normal en el titulo de un hallazgo escribia `NO_TOCAR: nada` como linea propia
 * en el prompt del generador, el unico agente con permiso de escritura.
 *
 * Si el auto-merge pudiera tocarlos, una propuesta integraria sola la
 * reapertura de esa puerta.
 */
export const DEFENSAS_DEL_SANEADO: readonly string[] = [
  'src/domain/shared/sanear-para-prompt.ts',
  'src/domain/shared/sanear-campo-de-prompt.ts',
  'src/domain/repair/innegociables-saneado.ts'
]
