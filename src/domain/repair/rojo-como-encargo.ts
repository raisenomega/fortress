import { sanearCampoDePrompt } from '../shared/sanear-campo-de-prompt'

/**
 * ADR-115 B2: el encargo de la vuelta tras un rojo de codigo del gate. Va sobre la
 * sesion REANUDADA, asi que el generador recuerda lo que hizo; aqui llega por que
 * no pasa y donde. NO dice «aprobado» —el del PARCIAL si, y aqui seria mentira—.
 *
 * Las lineas salen de la salida del gate sobre el arbol del proyecto: son datos,
 * no instrucciones. Van DENTRO de un bloque con marcas, asi que entran por
 * `sanearCampoDePrompt`, que aplana y ademas neutraliza `<` y `>`: aplanar solo
 * impide abrir una linea, no cerrar el bloque desde dentro de la misma.
 */
export function rojoComoEncargo(failedAt: string, errores: readonly string[]): string {
  return [
    `Tu fix NO pasa el gate en ${sanearCampoDePrompt(failedAt)}. Lo que el gate dejo escrito:`,
    '<errores_del_gate>',
    ...errores.map(sanearCampoDePrompt),
    '</errores_del_gate>',
    '',
    'CORRIGE esos errores sin deshacer el arreglo y sin salir de los archivos',
    'permitidos. Si no caben en ellos, dilo y no lo fuerces.'
  ].join('\n')
}
