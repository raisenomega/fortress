import { lazoStop } from '@domain/system/lazo-decision'
import { useConstruirStore } from '../stores/construir-store'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { submitConstruir } from './construir-service'
import { dirigirAlCto } from './dirigir-al-cto'
import { MAX_VUELTAS_DEFECTO, nadaQueHacerAhora } from './lazo-trabajo'

const EMPUJON = 'Continua con el siguiente hallazgo vivo del proyecto.'

/**
 * El EMPUJON del lazo (Sello 2b-c): un turno del CTO SIN PASO no para el lazo
 * —puede ser un item rechazado/descartado/caducado/obsoleto—. Si el lazo esta
 * activo y queda trabajo sin tope, se re-engancha al CTO para que proponga el
 * siguiente ("pasa al siguiente"). Para SOLO si `lazoStop` lo pide: tope de
 * vueltas, estancamiento (ya se empujo y sigue sin PASO), sin vivos, o Detener.
 */
export function empujonAlCto(): void {
  const lazo = useLazoStore.getState()
  if (!lazo.activo) return // sin lazo, un no-PASO es conversacion normal del CTO
  const projectId = useProjectStore.getState().activeProjectId
  const stop = lazoStop({
    cancelled: false,
    topeDiario: false,
    iteraciones: lazo.iteraciones,
    maxIteraciones: MAX_VUELTAS_DEFECTO,
    nadaQueHacer: nadaQueHacerAhora(projectId)
  })
  if (stop !== null) {
    lazo.parar()
    return
  }
  useSaltoStore.getState().programar('al-cto', ESPERA_DEL_SALTO_MS, () => {
    useConstruirStore.getState().setInput(EMPUJON)
    if (projectId !== null) dirigirAlCto(projectId) // antepone la cabeza (ATERRIZAJE-3)
    submitConstruir(projectId ?? '')
    useLazoStore.getState().estancar()
  })
}
