import { ESTA_INSTALACION } from '@domain/system/observacion-de-fallo'
import { getAppContext } from '../persistence/app-context'
import { registrarFallo } from './log-de-fallos'
import type { SumideroDeFallos } from './embudo-de-arranque'

/**
 * Las dos salidas cableadas de verdad (ADR-086). Vive aparte del embudo porque
 * toca Electron y la base, y el embudo tiene que poder probarse sin ninguno.
 *
 * `add` y no `asentarNotas`: aquel exige un `Project` y le pone su `path` al
 * cerco, y un fallo del proceso principal NO tiene proyecto de cliente —no
 * revienta auditando nada, revienta en la instalacion—. Pasa igual por el cuello
 * de botella del Nivel 1, con su cerco y su dedup; solo entra sin proyecto.
 */
export const sumideroDeFallos: SumideroDeFallos = {
  asentar: (nota) =>
    void getAppContext().selfObservations.add({ ...nota, sourceProject: ESTA_INSTALACION }),
  registrar: (operacion, error) => registrarFallo(new Date().toISOString(), operacion, error)
}
