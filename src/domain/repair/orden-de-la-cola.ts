import { selectTarget, type Candidate } from './select-target'

/**
 * La cola del lazo en ORDEN: severidad-primero y los cinco desempates, reusando
 * la MISMA seleccion firmada (`selectTarget`) una y otra vez —saca la cabeza, la
 * quita, repite—. Asi el orden del lazo ES el del Motor, sin copiar su
 * comparador ni tocar el fichero firmado. Devuelve los ids ELEGIBLES; los no
 * elegibles (debut) quedan fuera, igual que en una vuelta del Motor. Puro.
 */
export function ordenarCola(candidatos: readonly Candidate[]): readonly string[] {
  const ids: string[] = []
  let pozo = candidatos
  for (;;) {
    const sel = selectTarget(pozo)
    if (sel === null) break
    ids.push(sel.target.id)
    pozo = pozo.filter((c) => c.id !== sel.target.id)
  }
  return ids
}
