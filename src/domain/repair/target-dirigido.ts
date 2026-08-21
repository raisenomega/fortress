import { isDebutEligible } from './debut'
import type { Candidate, Selection } from './select-target'

/**
 * El operador senala un hallazgo y el motor lo atiende sin pasar por la cola.
 *
 * No es una seleccion: no se esta eligiendo entre varios, asi que la superficie,
 * la antiguedad y el reparto por carpeta —que existen para ordenar a los que
 * compiten— no pintan nada aqui. La justificacion lo dice tal cual, porque el
 * libro de vida guarda POR QUE se ataco cada hallazgo, y "lo pidio el operador"
 * es una razon distinta de "gano el orden".
 *
 * Lo que dirigir NO salta es el ESTRENO. El terreno que el motor tiene permitido
 * tocar no depende de quien pregunte: es cuanta confianza se ha acumulado, y un
 * clic no la acumula. Ampliarlo es una decision aparte, deliberada.
 */
export function dirigirA(target: Candidate): Selection | null {
  if (!isDebutEligible(target)) return null
  const reason =
    `${target.title} (${target.file}:${target.line}, ${target.severity}). DIRIGIDO: lo pidio el ` +
    `operador sobre este hallazgo concreto; no lo eligio la cola. Puede no caber en el cerco de ` +
    `integracion automatica, y entonces su fix terminara pidiendo firma humana.`
  return { target, reason }
}
