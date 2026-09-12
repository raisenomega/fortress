import type { Candidate, Selection } from './select-target'

/**
 * El operador pide COMPROBAR que su arreglo cerro el problema (ADR-087).
 *
 * Hermano de `dirigirA` y distinto en lo que importa: aquel prepara un hallazgo
 * para que el motor lo REPARE, y por eso respeta el estreno —«el terreno que el
 * motor tiene permitido tocar no depende de quien pregunte»—. Verificar no toca
 * nada: el analista abre el fichero, lo lee y dictamina. Pedirle confianza
 * acumulada a una lectura seria cobrar por un permiso que nadie usa, y dejaria
 * sin salida justo a los hallazgos que el motor aun no puede atender.
 *
 * La justificacion lo dice tal cual porque el libro guarda POR QUE se miro cada
 * hallazgo, y «el operador dijo que ya estaba arreglado y quiere comprobarlo» es
 * una razon distinta de «lo pidio el operador para repararlo».
 */
export function paraVerificar(target: Candidate): Selection {
  const reason =
    `${target.title} (${target.file}:${target.line}, ${target.severity}). VERIFICACION: el ` +
    `operador lo marco como arreglado y pide comprobarlo. Solo lectura: no se repara nada, se ` +
    `mira si el problema sigue en el fichero. Si la ausencia no se prueba, el hallazgo NO muere.`
  return { target, reason }
}
