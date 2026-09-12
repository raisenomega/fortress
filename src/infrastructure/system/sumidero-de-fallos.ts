import { getAppContext } from '../persistence/app-context'
import { conOrigen } from './origen-del-fallo'
import { registrarFallo } from './log-de-fallos'
import type { SumideroDeFallos } from './red-del-embudo'

/**
 * Las dos salidas cableadas de verdad (ADR-086). Vive aparte de los embudos
 * porque toca Electron y la base, y ellos tienen que probarse sin ninguno.
 *
 * `add` y no `asentarNotas`: aquel exige un `Project` y aqui puede no haberlo.
 * Igual pasa por el cuello de botella del Nivel 1, con su cerco y su dedup;
 * quien decide de quien es el fallo es `conOrigen`, que se prueba aparte.
 */
export const sumideroDeFallos: SumideroDeFallos = {
  asentar: (nota, projectId) => {
    const ctx = getAppContext()
    ctx.selfObservations.add(conOrigen((id) => ctx.projects.findById(id), nota, projectId))
  },
  registrar: (que, error) => registrarFallo(new Date().toISOString(), que, error)
}
